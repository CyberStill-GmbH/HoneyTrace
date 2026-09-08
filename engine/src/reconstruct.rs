use crate::{AttackTrace, CorrelationGroup, EngineError, Evidence};

/// Puerto para convertir un grupo correlacionado en una narrativa auditable.
pub trait AttackReconstructor {
    fn reconstruct(&self, group: &CorrelationGroup) -> Result<AttackTrace, EngineError>;
}

#[derive(Debug, Default)]
pub struct UnimplementedReconstructor;

impl AttackReconstructor for UnimplementedReconstructor {
    fn reconstruct(&self, _group: &CorrelationGroup) -> Result<AttackTrace, EngineError> {
        Err(EngineError::NotImplemented {
            component: "reconstruction",
        })
    }
}

#[derive(Debug, Default)]
pub struct RuleBasedReconstructor;

impl AttackReconstructor for RuleBasedReconstructor {
    fn reconstruct(&self, group: &CorrelationGroup) -> Result<AttackTrace, EngineError> {
        let first = group
            .events
            .first()
            .ok_or_else(|| EngineError::InvalidEvent("grupo vacío".into()))?;
        let last = group.events.last().unwrap_or(first);
        let mut stages = Vec::new();
        let mut techniques = Vec::new();
        let evidence = group
            .events
            .iter()
            .filter_map(|event| {
                let vulnerability = event.vulnerability.as_deref()?;
                let (stage, technique) = vulnerability_mapping(vulnerability)?;
                stages.push(stage.to_string());
                techniques.push(technique.to_string());
                Some(Evidence {
                    event_id: event.event_id.clone(),
                    reason: format!("señal observada para {vulnerability}"),
                    source: Some(event.raw_source.clone()),
                })
            })
            .collect::<Vec<_>>();
        stages.sort();
        stages.dedup();
        techniques.sort();
        techniques.dedup();
        if evidence.is_empty() {
            return Err(EngineError::InvalidEvent(
                "grupo sin señal de vulnerabilidad".into(),
            ));
        }
        Ok(AttackTrace {
            trace_id: first.trace_id.clone(),
            started_at: first.timestamp.clone(),
            ended_at: last.timestamp.clone(),
            stages,
            event_ids: group.event_ids.clone(),
            techniques,
            confidence: 0.0,
            evidence,
        })
    }
}

fn vulnerability_mapping(value: &str) -> Option<(&'static str, &'static str)> {
    let canonical = value.trim().to_ascii_lowercase().replace([' ', '-'], "_");
    match canonical.as_str() {
        "brute_force" => Some(("auth-brute-force", "T1110")),
        "idor" => Some(("users-idor", "HT-IDOR")),
        "sqli" => Some(("products-sqli", "HT-SQLI")),
        "path_traversal" => Some(("files-path-traversal", "HT-PATH-TRAVERSAL")),
        "stored_xss" | "stored_xss_mediante_note" => Some(("orders-stored-xss", "HT-STORED-XSS")),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::NormalizedEvent;

    #[test]
    fn reconstruye_solo_con_vulnerabilidad_conocida() {
        let event = NormalizedEvent {
            schema_version: "1.1".into(),
            event_id: "e1".into(),
            timestamp: "2026-01-01T00:00:00Z".into(),
            ingest_timestamp: None,
            trace_id: "t".into(),
            sequence: 1,
            event_type: "http.request".into(),
            raw_source: "honeypot".into(),
            source_ip: None,
            session_id: None,
            method: None,
            path: Some("/auth".into()),
            status_code: Some(401),
            user_id: None,
            duration_ms: None,
            user_agent: None,
            vulnerability: Some("brute_force".into()),
            outcome: Some("failure".into()),
            payload_sha256: None,
            payload_size: None,
            entities: vec![],
            causes: vec![],
            metadata: serde_json::json!({}),
        };
        let group = CorrelationGroup {
            correlation_id: "c".into(),
            event_ids: vec!["e1".into()],
            events: vec![event],
        };
        let trace = RuleBasedReconstructor.reconstruct(&group).unwrap();
        assert_eq!(trace.stages, vec!["auth-brute-force"]);
        assert_eq!(trace.evidence.len(), 1);
    }

    #[test]
    fn reconoce_las_etiquetas_reales_del_honeypot() {
        for (label, technique) in [
            ("Brute Force", "T1110"),
            ("IDOR", "HT-IDOR"),
            ("SQLi", "HT-SQLI"),
            ("Path Traversal", "HT-PATH-TRAVERSAL"),
            ("Stored XSS mediante Note", "HT-STORED-XSS"),
        ] {
            assert_eq!(vulnerability_mapping(label).unwrap().1, technique);
        }
    }
}
