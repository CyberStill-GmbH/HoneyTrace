use serde::{Deserialize, Serialize};

use crate::correlate::{CorrelationEngine, DeterministicCorrelation};
use crate::reconstruct::{AttackReconstructor, RuleBasedReconstructor};
use crate::scoring::{AttributionScorer, ConservativeScorer};
use crate::{AttackTrace, EngineError, NormalizedEvent};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct IngestEnvelope {
    pub source_id: String,
    pub schema_version: String,
    pub trace: AttackTrace,
    pub events: Vec<NormalizedEvent>,
}

pub fn reconstruct(
    source_id: &str,
    events: &[NormalizedEvent],
) -> Result<Vec<IngestEnvelope>, EngineError> {
    DeterministicCorrelation::default()
        .correlate(events)?
        .into_iter()
        .map(|group| {
            let mut trace = RuleBasedReconstructor.reconstruct(&group)?;
            trace.confidence = ConservativeScorer.score(&trace)?;
            Ok(IngestEnvelope {
                source_id: source_id.to_owned(),
                schema_version: "1.1".to_owned(),
                trace,
                events: group.events,
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn event(id: &str, vulnerability: Option<&str>) -> NormalizedEvent {
        NormalizedEvent {
            schema_version: "1.1".into(),
            event_id: id.into(),
            timestamp: "2026-01-01T00:00:00Z".into(),
            ingest_timestamp: None,
            trace_id: "trace-1".into(),
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
            vulnerability: vulnerability.map(str::to_owned),
            outcome: Some("observed".into()),
            payload_sha256: None,
            payload_size: None,
            entities: vec![],
            causes: vec![],
            metadata: serde_json::json!({}),
        }
    }

    #[test]
    fn produce_el_contrato_que_acepta_el_visualizador() {
        let envelopes = reconstruct(
            "rpi-lab",
            &[event("e1", Some("brute_force")), event("e2", None)],
        )
        .unwrap();
        assert_eq!(envelopes.len(), 1);
        assert_eq!(envelopes[0].source_id, "rpi-lab");
        assert_eq!(envelopes[0].trace.techniques, vec!["T1110"]);
        assert_eq!(envelopes[0].events.len(), 2);
    }
}
