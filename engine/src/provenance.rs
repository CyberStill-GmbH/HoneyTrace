use crate::{EngineError, NormalizedEvent};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProvenanceNode {
    pub event_id: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProvenanceEdge {
    pub from: String,
    pub to: String,
    pub relation: String,
}

/// Representación futura del grafo temporal/causal de procedencia.
#[derive(Debug, Default)]
pub struct ProvenanceGraph {
    pub nodes: Vec<ProvenanceNode>,
    pub edges: Vec<ProvenanceEdge>,
}

impl ProvenanceGraph {
    /// Construye sólo relaciones observables para evitar dependencias espurias.
    pub fn from_events(events: &[NormalizedEvent], max_edges: usize) -> Result<Self, EngineError> {
        let mut graph = Self {
            nodes: events
                .iter()
                .map(|event| ProvenanceNode {
                    event_id: event.event_id.clone(),
                })
                .collect(),
            edges: Vec::new(),
        };
        for event in events {
            for cause in &event.causes {
                if events.iter().any(|candidate| candidate.event_id == *cause) {
                    graph.edges.push(ProvenanceEdge {
                        from: cause.clone(),
                        to: event.event_id.clone(),
                        relation: "causes".into(),
                    });
                }
            }
        }
        for pair in events.windows(2) {
            if pair[0]
                .entities
                .iter()
                .any(|left| pair[1].entities.iter().any(|right| left.id == right.id))
            {
                graph.edges.push(ProvenanceEdge {
                    from: pair[0].event_id.clone(),
                    to: pair[1].event_id.clone(),
                    relation: "shared-entity".into(),
                });
            }
        }
        graph.edges.sort_by(|left, right| {
            (&left.from, &left.to, &left.relation).cmp(&(&right.from, &right.to, &right.relation))
        });
        graph.edges.dedup();
        if graph.edges.len() > max_edges {
            return Err(EngineError::ResourceLimit(format!(
                "grafo supera {max_edges} aristas"
            )));
        }
        Ok(graph)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::Entity;

    fn event(id: &str, causes: Vec<&str>, entity: &str) -> NormalizedEvent {
        NormalizedEvent {
            schema_version: "1.1".into(),
            event_id: id.into(),
            timestamp: "2026-01-01T00:00:00Z".into(),
            ingest_timestamp: None,
            trace_id: "t".into(),
            sequence: 1,
            event_type: "http.request".into(),
            raw_source: "honeypot".into(),
            source_ip: None,
            session_id: None,
            method: None,
            path: None,
            status_code: None,
            user_id: None,
            duration_ms: None,
            user_agent: None,
            vulnerability: None,
            outcome: None,
            payload_sha256: None,
            payload_size: None,
            entities: vec![Entity {
                id: entity.into(),
                kind: "endpoint".into(),
                role: None,
            }],
            causes: causes.into_iter().map(str::to_string).collect(),
            metadata: serde_json::json!({}),
        }
    }

    #[test]
    fn conserva_solo_causas_y_entidades_observables() {
        let graph = ProvenanceGraph::from_events(
            &[
                event("a", vec![], "x"),
                event("b", vec!["a", "missing"], "x"),
            ],
            10,
        )
        .unwrap();
        assert_eq!(graph.nodes.len(), 2);
        assert_eq!(graph.edges.len(), 2);
        assert!(graph.edges.iter().any(|edge| edge.relation == "causes"));
    }
}
