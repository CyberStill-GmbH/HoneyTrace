use crate::{AttackTrace, EngineError};

/// Política futura para separar evidencia observada de inferencias.
pub trait AttributionScorer {
    fn score(&self, trace: &AttackTrace) -> Result<f32, EngineError>;
}

#[derive(Debug, Default)]
pub struct ConservativeScorer;

impl AttributionScorer for ConservativeScorer {
    fn score(&self, trace: &AttackTrace) -> Result<f32, EngineError> {
        if trace.evidence.is_empty() || trace.event_ids.is_empty() {
            return Ok(0.0);
        }
        let coverage = trace.evidence.len() as f32 / trace.event_ids.len() as f32;
        Ok(coverage.clamp(0.0, 1.0))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Evidence;

    #[test]
    fn puntua_cobertura_de_evidencia() {
        let trace = AttackTrace {
            trace_id: "t".into(),
            started_at: "a".into(),
            ended_at: "b".into(),
            stages: vec!["auth".into()],
            event_ids: vec!["e1".into(), "e2".into()],
            techniques: vec![],
            confidence: 0.0,
            evidence: vec![Evidence {
                event_id: "e1".into(),
                reason: "señal".into(),
                source: None,
            }],
        };
        assert_eq!(ConservativeScorer.score(&trace).unwrap(), 0.5);
    }
}
