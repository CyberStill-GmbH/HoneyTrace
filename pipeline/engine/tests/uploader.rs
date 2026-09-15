use std::io::{Read, Write};
use std::net::TcpListener;
use std::thread;

use honeytrace_engine::pipeline::{reconstruct, IngestEnvelope};
use honeytrace_engine::uploader::{ApiUploader, UploadError};
use honeytrace_engine::NormalizedEvent;

fn envelope() -> IngestEnvelope {
    let event = NormalizedEvent {
        schema_version: "1.1".into(),
        event_id: "e1".into(),
        timestamp: "2026-01-01T00:00:00Z".into(),
        ingest_timestamp: None,
        trace_id: "trace-http".into(),
        sequence: 1,
        event_type: "HTTP_REQUEST".into(),
        raw_source: "honeypot-api".into(),
        source_ip: Some("192.0.2.10".into()),
        session_id: None,
        method: Some("POST".into()),
        path: Some("/auth".into()),
        status_code: Some(401),
        user_id: None,
        duration_ms: Some(2.0),
        user_agent: None,
        vulnerability: Some("brute_force".into()),
        outcome: Some("observed".into()),
        payload_sha256: None,
        payload_size: None,
        entities: vec![],
        causes: vec![],
        metadata: serde_json::json!({}),
    };
    reconstruct("pc-laboratorio", &[event]).unwrap().remove(0)
}

fn mock_api(status: &str) -> (String, thread::JoinHandle<String>) {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let address = listener.local_addr().unwrap();
    let status = status.to_owned();
    let handle = thread::spawn(move || {
        let (mut stream, _) = listener.accept().unwrap();
        let mut request = Vec::new();
        let mut buffer = [0_u8; 4096];
        loop {
            let count = stream.read(&mut buffer).unwrap();
            if count == 0 {
                break;
            }
            request.extend_from_slice(&buffer[..count]);
            if let Some(header_end) = request.windows(4).position(|part| part == b"\r\n\r\n") {
                let headers = String::from_utf8_lossy(&request[..header_end]);
                let content_length = headers
                    .lines()
                    .find_map(|line| {
                        line.to_ascii_lowercase()
                            .strip_prefix("content-length:")
                            .map(|value| value.trim().parse::<usize>().unwrap())
                    })
                    .unwrap_or(0);
                if request.len() >= header_end + 4 + content_length {
                    break;
                }
            }
        }
        let response =
            format!("HTTP/1.1 {status}\r\nContent-Length: 2\r\nConnection: close\r\n\r\n{{}}");
        stream.write_all(response.as_bytes()).unwrap();
        String::from_utf8(request).unwrap()
    });
    (format!("http://{address}"), handle)
}

#[test]
fn envia_bearer_y_contrato_completo() {
    let (url, server) = mock_api("201 Created");
    ApiUploader::new(&url, "token-secreto".into())
        .unwrap()
        .upload(&envelope())
        .unwrap();
    let request = server.join().unwrap();
    assert!(request.contains("POST /api/v1/analyses/ingest"));
    assert!(request
        .to_ascii_lowercase()
        .contains("authorization: bearer token-secreto"));
    assert!(request.contains("\"source_id\":\"pc-laboratorio\""));
    assert!(request.contains("\"events\":["));
}

#[test]
fn no_reintenta_credenciales_revocadas() {
    let (url, server) = mock_api("401 Unauthorized");
    let error = ApiUploader::new(&url, "revocado".into())
        .unwrap()
        .upload(&envelope())
        .unwrap_err();
    server.join().unwrap();
    assert!(matches!(error, UploadError::Unauthorized));
    assert!(!error.retryable());
}

#[test]
fn normaliza_metadata_omitida_antes_de_publicar() {
    let raw = r#"{"schema_version":"1.1","event_id":"e","timestamp":"2026-01-01T00:00:00Z","trace_id":"t","sequence":0,"event_type":"PATH_TRAVERSAL_ACCESS","raw_source":"honeypot-api","vulnerability":"Path Traversal"}"#;
    let event: NormalizedEvent = serde_json::from_str(raw).unwrap();
    assert_eq!(event.metadata, serde_json::json!({}));
    assert_eq!(
        serde_json::to_value(event).unwrap()["metadata"],
        serde_json::json!({})
    );
}
