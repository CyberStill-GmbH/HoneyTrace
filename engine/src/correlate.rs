use crate::{CorrelationGroup, EngineError, NormalizedEvent};

/// Puerto para agrupar eventos que pertenecen a una misma intrusión.
pub trait CorrelationEngine {
    fn correlate(&self, events: &[NormalizedEvent]) -> Result<Vec<CorrelationGroup>, EngineError>;
}

/// Implementación intencionalmente ausente. Aquí se conectará el algoritmo.
#[derive(Debug, Default)]
pub struct UnimplementedCorrelation;

impl CorrelationEngine for UnimplementedCorrelation {
    fn correlate(&self, _events: &[NormalizedEvent]) -> Result<Vec<CorrelationGroup>, EngineError> {
        Err(EngineError::NotImplemented {
            component: "correlation",
        })
    }
}
