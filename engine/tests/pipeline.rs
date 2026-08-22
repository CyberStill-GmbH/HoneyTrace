use honeytrace_engine::correlate::{CorrelationEngine, DeterministicCorrelation};
use honeytrace_engine::provenance::ProvenanceGraph;
use honeytrace_engine::reconstruct::{AttackReconstructor, RuleBasedReconstructor};
use honeytrace_engine::scoring::{AttributionScorer, ConservativeScorer};
use honeytrace_engine::{Entity, NormalizedEvent};

fn event(id: &str, sequence: u64, vulnerability: &str, causes: Vec<&str>) -> NormalizedEvent {
    NormalizedEvent {
        schema_version: "1.1".into(),
        event_id: id.into(),
        timestamp: format!("2026-01-01T00:00:0{sequence}Z"),
        ingest_timestamp: None,
        trace_id: "attack-1".into(),
        sequence,
        event_type: "http.request".into(),
        raw_source: "honeypot".into(),
        source_ip: Some("192.0.2.10".into()),
        session_id: Some("s-1".into()),
        method: Some("POST".into()),
        path: Some("/auth".into()),
        status_code: Some(401),
        user_id: None,
        duration_ms: Some(2.0),
        user_agent: Some("test-agent".into()),
        vulnerability: Some(vulnerability.into()),
        outcome: Some("observed".into()),
        payload_sha256: None,
        payload_size: Some(10),
        entities: vec![Entity {
            id: "s-1".into(),
            kind: "session".into(),
            role: None,
        }],
        causes: causes.into_iter().map(str::to_string).collect(),
        metadata: serde_json::json!({}),
    }
}

#[test]
fn pipeline_completo_produce_traza_auditable() {
    let events = vec![
        event("e1", 1, "brute_force", vec![]),
        event("e2", 2, "brute_force", vec!["e1"]),
        event("e3", 3, "brute_force", vec!["e2"]),
    ];
    let groups = DeterministicCorrelation::default()
        .correlate(&events)
        .unwrap();
    assert_eq!(groups.len(), 1);
    let graph = ProvenanceGraph::from_events(&groups[0].events, 10).unwrap();
    assert_eq!(graph.edges.len(), 4);
    let mut trace = RuleBasedReconstructor.reconstruct(&groups[0]).unwrap();
    trace.confidence = ConservativeScorer.score(&trace).unwrap();
    assert_eq!(trace.event_ids.len(), 3);
    assert_eq!(trace.evidence.len(), 3);
    assert!(trace.confidence > 0.9);
}
