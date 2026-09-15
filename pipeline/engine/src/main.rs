use std::collections::HashMap;
use std::env;
use std::fs::{self, File, OpenOptions};
use std::io::{BufRead, BufReader, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use honeytrace_engine::pipeline::reconstruct;
use honeytrace_engine::uploader::ApiUploader;
use honeytrace_engine::NormalizedEvent;
use serde::{Deserialize, Serialize};

#[derive(Debug)]
struct Config {
    events_file: PathBuf,
    state_file: PathBuf,
    token_file: PathBuf,
    api_url: String,
    source_id: String,
    poll_interval: Duration,
    settle_after_secs: u64,
    run_once: bool,
}

#[derive(Debug, Default, Serialize, Deserialize)]
struct AgentState {
    offset: u64,
    #[serde(default)]
    file_id: u64,
    #[serde(default)]
    pending: HashMap<String, PendingTrace>,
}

#[derive(Debug, Serialize, Deserialize)]
struct PendingTrace {
    events: Vec<NormalizedEvent>,
    updated_at: u64,
    #[serde(default)]
    attempts: u32,
    #[serde(default)]
    retry_at: u64,
}

fn required(name: &str) -> Result<String, String> {
    env::var(name).map_err(|_| format!("falta la variable {name}"))
}

impl Config {
    fn from_env() -> Result<Self, String> {
        let poll_seconds = env::var("HONEYTRACE_POLL_SECONDS")
            .unwrap_or_else(|_| "2".into())
            .parse::<u64>()
            .map_err(|_| "HONEYTRACE_POLL_SECONDS debe ser entero".to_string())?;
        let settle_after_secs = env::var("HONEYTRACE_SETTLE_SECONDS")
            .unwrap_or_else(|_| "3".into())
            .parse::<u64>()
            .map_err(|_| "HONEYTRACE_SETTLE_SECONDS debe ser entero".to_string())?;
        Ok(Self {
            events_file: required("HONEYTRACE_EVENTS_FILE")?.into(),
            state_file: required("HONEYTRACE_STATE_FILE")?.into(),
            token_file: required("HONEYTRACE_INGEST_TOKEN_FILE")?.into(),
            api_url: required("HONEYTRACE_API_URL")?,
            source_id: required("HONEYTRACE_SOURCE_ID")?,
            poll_interval: Duration::from_secs(poll_seconds.max(1)),
            settle_after_secs,
            run_once: env::var("HONEYTRACE_RUN_ONCE").is_ok_and(|value| value == "true"),
        })
    }
}

fn unix_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

#[cfg(unix)]
fn file_id(metadata: &fs::Metadata) -> u64 {
    use std::os::unix::fs::MetadataExt;
    metadata.ino()
}

#[cfg(not(unix))]
fn file_id(_metadata: &fs::Metadata) -> u64 {
    0
}

fn load_state(path: &Path) -> Result<AgentState, Box<dyn std::error::Error>> {
    match fs::read(path) {
        Ok(bytes) => Ok(serde_json::from_slice(&bytes)?),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(AgentState::default()),
        Err(error) => Err(error.into()),
    }
}

fn save_state(path: &Path, state: &AgentState) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let temporary = path.with_extension("tmp");
    let mut file = OpenOptions::new()
        .create(true)
        .truncate(true)
        .write(true)
        .open(&temporary)?;
    serde_json::to_writer(&mut file, state)?;
    file.flush()?;
    file.sync_all()?;
    fs::rename(temporary, path)?;
    Ok(())
}

fn collect_lines(
    file: File,
    offset: &mut u64,
    state: &mut AgentState,
) -> Result<usize, Box<dyn std::error::Error>> {
    let mut reader = BufReader::new(file);
    reader.seek(SeekFrom::Start(*offset))?;
    let mut consumed = 0;
    loop {
        let line_start = reader.stream_position()?;
        let mut line = String::new();
        let bytes = reader.read_line(&mut line)?;
        if bytes == 0 {
            break;
        }
        if !line.ends_with('\n') {
            *offset = line_start;
            break;
        }
        *offset = reader.stream_position()?;
        consumed += 1;
        match serde_json::from_str::<NormalizedEvent>(line.trim()) {
            Ok(event) => {
                let now = unix_now();
                let pending = state
                    .pending
                    .entry(event.trace_id.clone())
                    .or_insert_with(|| PendingTrace {
                        events: Vec::new(),
                        updated_at: now,
                        attempts: 0,
                        retry_at: 0,
                    });
                if !pending
                    .events
                    .iter()
                    .any(|item| item.event_id == event.event_id)
                {
                    pending.events.push(event);
                    pending.updated_at = now;
                    pending.attempts = 0;
                    pending.retry_at = 0;
                }
            }
            Err(error) => eprintln!("evento descartado en byte {line_start}: {error}"),
        }
    }
    Ok(consumed)
}

fn read_appended(path: &Path, state: &mut AgentState) -> Result<usize, Box<dyn std::error::Error>> {
    let file = match File::open(path) {
        Ok(file) => file,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(0),
        Err(error) => return Err(error.into()),
    };
    let metadata = file.metadata()?;
    let current_id = file_id(&metadata);
    let rotated = state.file_id != 0 && current_id != 0 && state.file_id != current_id;
    let truncated = metadata.len() < state.offset;
    let mut consumed = 0;
    if rotated {
        let rotated_path = PathBuf::from(format!("{}.1", path.display()));
        if let Ok(old_file) = File::open(&rotated_path) {
            if file_id(&old_file.metadata()?) == state.file_id {
                let mut old_offset = state.offset;
                consumed += collect_lines(old_file, &mut old_offset, state)?;
            }
        }
        eprintln!("el log rotó; se completa el anterior y se lee el archivo activo");
        state.offset = 0;
    } else if truncated {
        eprintln!("el log fue truncado; se reinicia la lectura del archivo activo");
        state.offset = 0;
    }
    state.file_id = current_id;
    let mut offset = state.offset;
    consumed += collect_lines(file, &mut offset, state)?;
    state.offset = offset;
    Ok(consumed)
}

fn upload_ready(state: &mut AgentState, config: &Config, uploader: &ApiUploader) -> bool {
    let now = unix_now();
    let ready = state
        .pending
        .iter()
        .filter(|(_, trace)| {
            now.saturating_sub(trace.updated_at) >= config.settle_after_secs
                && now >= trace.retry_at
        })
        .map(|(trace_id, _)| trace_id.clone())
        .collect::<Vec<_>>();
    let mut changed = false;
    for trace_id in ready {
        let Some(pending) = state.pending.get(&trace_id) else {
            continue;
        };
        match reconstruct(&config.source_id, &pending.events) {
            Ok(envelopes) => match envelopes.iter().try_for_each(|item| uploader.upload(item)) {
                Ok(()) => {
                    println!(
                        "traza {trace_id} enviada ({} eventos)",
                        pending.events.len()
                    );
                    state.pending.remove(&trace_id);
                    changed = true;
                }
                Err(error) => {
                    let trace = state.pending.get_mut(&trace_id).expect("traza existente");
                    trace.attempts = trace.attempts.saturating_add(1);
                    trace.retry_at = now
                        + if error.retryable() {
                            2_u64.pow(trace.attempts.min(8)).min(300)
                        } else {
                            300
                        };
                    eprintln!("no se pudo enviar {trace_id}: {error}");
                    changed = true;
                }
            },
            Err(error) => {
                // Las solicitudes normales son telemetría válida, pero no una reconstrucción publicable.
                eprintln!("traza {trace_id} sin reconstrucción publicable: {error}");
                state.pending.remove(&trace_id);
                changed = true;
            }
        }
    }
    changed
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    let config =
        Config::from_env().map_err(|message| format!("configuración inválida: {message}"))?;
    let token = fs::read_to_string(&config.token_file)?.trim().to_owned();
    if token.is_empty() {
        return Err("el archivo del token de ingestión está vacío".into());
    }
    let uploader = ApiUploader::new(&config.api_url, token)?;
    let mut state = load_state(&config.state_file)?;
    // Un reinicio manual suele acompañar una corrección de red, credencial o contrato.
    // Permite un intento inmediato sin descartar el contador persistido.
    state
        .pending
        .values_mut()
        .for_each(|trace| trace.retry_at = 0);
    println!(
        "HoneyTrace Engine sigue {} y publica como {}",
        config.events_file.display(),
        config.source_id
    );
    loop {
        let read = read_appended(&config.events_file, &mut state)?;
        let changed = upload_ready(&mut state, &config, &uploader);
        if read > 0 || changed {
            save_state(&config.state_file, &state)?;
        }
        if config.run_once {
            break Ok(());
        }
        thread::sleep(config.poll_interval);
    }
}

fn main() {
    if let Err(error) = run() {
        eprintln!("HoneyTrace Engine terminó: {error}");
        std::process::exit(1);
    }
}
