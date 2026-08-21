//! Contratos del correlation engine de HoneyTrace.
//!
//! Este crate es deliberadamente un esqueleto: define límites, modelos y
//! puertos para que la implementación de los algoritmos ocurra después.

pub mod correlate;
pub mod error;
pub mod ingest;
pub mod model;
pub mod provenance;
pub mod reconstruct;
pub mod scoring;

pub use error::EngineError;
pub use model::{AttackTrace, CorrelationGroup, NormalizedEvent};
