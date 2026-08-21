use thiserror::Error;

#[derive(Debug, Error)]
pub enum EngineError {
    #[error("evento normalizado inválido: {0}")]
    InvalidEvent(String),
    #[error("orden temporal inválido: {0}")]
    InvalidOrdering(String),
    #[error("JSON inválido: {0}")]
    Json(#[from] serde_json::Error),
    #[error("I/O: {0}")]
    Io(#[from] std::io::Error),
    #[error("componente no implementado: {component}")]
    NotImplemented { component: &'static str },
}
