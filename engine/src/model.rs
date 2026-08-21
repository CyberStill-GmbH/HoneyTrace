use serde::{Deserialize, Serialize};

/// Contrato de `schemas/normalized_event.schema.json`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct NormalizedEvent {
    pub schema_version: String,
    pub event_id: String,
    pub timestamp: String,
    #[serde(default)]
    pub ingest_timestamp: Option<String>,
    pub trace_id: String,
    pub sequence: u64,
    pub event_type: String,
    pub raw_source: String,
    #[serde(default)]
    pub source_ip: Option<String>,
    #[serde(default)]
    pub session_id: Option<String>,
    #[serde(default)]
    pub method: Option<String>,
    #[serde(default)]
    pub path: Option<String>,
    #[serde(default)]
    pub status_code: Option<u16>,
    #[serde(default)]
    pub user_id: Option<String>,
    #[serde(default)]
    pub duration_ms: Option<f64>,
    #[serde(default)]
    pub user_agent: Option<String>,
    #[serde(default)]
    pub vulnerability: Option<String>,
    #[serde(default)]
    pub outcome: Option<String>,
    #[serde(default)]
    pub payload_sha256: Option<String>,
    #[serde(default)]
    pub payload_size: Option<u64>,
    #[serde(default)]
    pub entities: Vec<Entity>,
    #[serde(default)]
    pub causes: Vec<String>,
    #[serde(default)]
    pub metadata: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Entity {
    pub id: String,
    pub kind: String,
    #[serde(default)]
    pub role: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CorrelationGroup {
    pub correlation_id: String,
    pub event_ids: Vec<String>,
    pub events: Vec<NormalizedEvent>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Evidence {
    pub event_id: String,
    pub reason: String,
    #[serde(default)]
    pub source: Option<String>,
}

/// Contrato de `schemas/attack_trace.schema.json`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AttackTrace {
    pub trace_id: String,
    pub started_at: String,
    pub ended_at: String,
    pub stages: Vec<String>,
    pub event_ids: Vec<String>,
    pub techniques: Vec<String>,
    pub confidence: f32,
    pub evidence: Vec<Evidence>,
}
