use std::io::BufRead;

use crate::{EngineError, NormalizedEvent};

/// Puerto de entrada para eventos NDJSON ya normalizados.
pub trait EventReader {
    fn read_ndjson<R: BufRead>(&self, reader: R) -> Result<Vec<NormalizedEvent>, EngineError>;
}

/// Adaptador de contrato. No correlaciona, ordena ni interpreta eventos.
#[derive(Debug, Default)]
pub struct NdjsonReader;

impl EventReader for NdjsonReader {
    fn read_ndjson<R: BufRead>(&self, reader: R) -> Result<Vec<NormalizedEvent>, EngineError> {
        reader
            .lines()
            .filter(|line| line.as_ref().map_or(true, |value| !value.trim().is_empty()))
            .map(|line| serde_json::from_str(&line?).map_err(EngineError::from))
            .collect()
    }
}
