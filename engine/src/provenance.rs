use crate::NormalizedEvent;

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
    /// Punto de extensión para conservar orden parcial, causas y entidades.
    pub fn from_events(_events: &[NormalizedEvent]) -> Self {
        Self::default()
    }
}
