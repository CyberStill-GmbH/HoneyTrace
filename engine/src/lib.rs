//! Contratos del correlation engine de HoneyTrace.
//!
//! Este crate contiene el núcleo determinista y los puertos para las fases
//! avanzadas de correlación y reconstrucción.

pub mod correlate;
pub mod error;
pub mod ingest;
pub mod model;
pub mod provenance;
pub mod reconstruct;
pub mod scoring;

pub use error::EngineError;
pub use model::{AttackTrace, CorrelationGroup, Entity, Evidence, NormalizedEvent};
