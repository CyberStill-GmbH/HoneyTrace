use crate::{AttackTrace, EngineError};

/// Política futura para separar evidencia observada de inferencias.
pub trait AttributionScorer {
    fn score(&self, trace: &AttackTrace) -> Result<f32, EngineError>;
}

#[derive(Debug, Default)]
pub struct ConservativeScorer;

impl AttributionScorer for ConservativeScorer {
    fn score(&self, _trace: &AttackTrace) -> Result<f32, EngineError> {
        Err(EngineError::NotImplemented {
            component: "scoring",
        })
    }
}
