use crate::{AttackTrace, CorrelationGroup, EngineError};

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
