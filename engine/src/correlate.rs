use chrono::{DateTime, Duration, Utc};

use crate::{CorrelationGroup, EngineError, NormalizedEvent};

/// Puerto para agrupar eventos que pertenecen a una misma intrusión.
pub trait CorrelationEngine {
    fn correlate(&self, events: &[NormalizedEvent]) -> Result<Vec<CorrelationGroup>, EngineError>;
}

#[derive(Debug, Clone)]
pub struct DeterministicCorrelation {
    pub window: Duration,
    pub max_events_per_group: usize,
}

impl Default for DeterministicCorrelation {
    fn default() -> Self {
        Self {
            window: Duration::seconds(300),
            max_events_per_group: 512,
        }
    }
}

impl CorrelationEngine for DeterministicCorrelation {
    fn correlate(&self, events: &[NormalizedEvent]) -> Result<Vec<CorrelationGroup>, EngineError> {
        let mut ordered = events.to_vec();
        ordered.sort_by_key(|event| {
            (
                event.timestamp.clone(),
                event.sequence,
                event.event_id.clone(),
            )
        });
        for event in &ordered {
            parse_timestamp(event)?;
        }
        let mut groups: Vec<CorrelationGroup> = Vec::new();
        for event in ordered {
            let timestamp = parse_timestamp(&event)?;
            let key = correlation_key(&event);
            let candidate = groups.iter().enumerate().rev().find_map(|(index, group)| {
                if correlation_key(&group.events[0]) != key {
                    return None;
                }
                let last = parse_timestamp(group.events.last().expect("grupo no vacío")).ok()?;
                (timestamp - last <= self.window).then_some(index)
            });
            if let Some(index) = candidate {
                let group = groups.get_mut(index).expect("grupo encontrado");
                if group.events.len() >= self.max_events_per_group {
                    return Err(EngineError::ResourceLimit(format!(
                        "grupo {} supera {} eventos",
                        group.correlation_id, self.max_events_per_group
                    )));
                }
                group.event_ids.push(event.event_id.clone());
                group.events.push(event);
            } else {
                let index = groups.len();
                groups.push(CorrelationGroup {
                    correlation_id: format!("corr-{key}-{index}"),
                    event_ids: vec![event.event_id.clone()],
                    events: vec![event],
                });
            }
        }
        Ok(groups)
    }
}

fn parse_timestamp(event: &NormalizedEvent) -> Result<DateTime<Utc>, EngineError> {
    DateTime::parse_from_rfc3339(&event.timestamp)
        .map(|value| value.with_timezone(&Utc))
        .map_err(|_| {
            EngineError::InvalidOrdering(format!("timestamp inválido en {}", event.event_id))
        })
}

fn correlation_key(event: &NormalizedEvent) -> String {
    if !event.trace_id.is_empty() {
        return format!("trace:{}", event.trace_id);
    }
    if let Some(session) = &event.session_id {
        return format!("session:{session}");
    }
    format!("source:{}", event.source_ip.as_deref().unwrap_or("unknown"))
}

#[derive(Debug, Default)]
pub struct UnimplementedCorrelation;

impl CorrelationEngine for UnimplementedCorrelation {
    fn correlate(&self, _events: &[NormalizedEvent]) -> Result<Vec<CorrelationGroup>, EngineError> {
        Err(EngineError::NotImplemented {
            component: "correlation",
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::Entity;

    fn event(id: &str, timestamp: &str, sequence: u64) -> NormalizedEvent {
        NormalizedEvent {
            schema_version: "1.1".into(),
            event_id: id.into(),
            timestamp: timestamp.into(),
            ingest_timestamp: None,
            trace_id: "trace-1".into(),
            sequence,
            event_type: "http.request".into(),
            raw_source: "honeypot".into(),
            source_ip: Some("10.0.0.1".into()),
            session_id: Some("session-1".into()),
            method: Some("GET".into()),
            path: Some("/auth".into()),
            status_code: Some(401),
            user_id: None,
            duration_ms: None,
            user_agent: None,
            vulnerability: None,
            outcome: None,
            payload_sha256: None,
            payload_size: None,
            entities: vec![Entity {
                id: "session-1".into(),
                kind: "session".into(),
                role: None,
            }],
            causes: vec![],
            metadata: serde_json::json!({}),
        }
    }

    #[test]
    fn agrupa_por_trace_y_orden_determinista() {
        let engine = DeterministicCorrelation::default();
        let groups = engine
            .correlate(&[
                event("b", "2026-01-01T00:00:02Z", 2),
                event("a", "2026-01-01T00:00:01Z", 1),
            ])
            .unwrap();
        assert_eq!(groups.len(), 1);
        assert_eq!(groups[0].event_ids, vec!["a", "b"]);
    }

    #[test]
    fn separa_eventos_fuera_de_ventana() {
        let engine = DeterministicCorrelation {
            window: Duration::seconds(1),
            max_events_per_group: 10,
        };
        let groups = engine
            .correlate(&[
                event("a", "2026-01-01T00:00:00Z", 1),
                event("b", "2026-01-01T00:00:05Z", 2),
            ])
            .unwrap();
        assert_eq!(groups.len(), 2);
    }

    #[test]
    fn mantiene_trazas_intercaladas_en_grupos_independientes() {
        let mut first = event("a1", "2026-01-01T00:00:01Z", 1);
        first.trace_id = "a".into();
        let mut second = event("b1", "2026-01-01T00:00:02Z", 1);
        second.trace_id = "b".into();
        let mut next_first = event("a2", "2026-01-01T00:00:03Z", 2);
        next_first.trace_id = "a".into();
        let groups = DeterministicCorrelation::default()
            .correlate(&[first, second, next_first])
            .unwrap();
        assert_eq!(groups.len(), 2);
        assert!(groups
            .iter()
            .any(|group| group.event_ids == vec!["a1", "a2"]));
    }
}
