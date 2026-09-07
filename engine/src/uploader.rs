use std::time::Duration;

use reqwest::blocking::Client;
use reqwest::StatusCode;
use thiserror::Error;

use crate::pipeline::IngestEnvelope;

#[derive(Debug, Error)]
pub enum UploadError {
    #[error("la API rechazó la credencial de ingestión")]
    Unauthorized,
    #[error("la API rechazó el contrato ({status}): {body}")]
    Rejected { status: StatusCode, body: String },
    #[error("falló la conexión con la API: {0}")]
    Transport(#[from] reqwest::Error),
}

impl UploadError {
    pub fn retryable(&self) -> bool {
        match self {
            Self::Transport(_) => true,
            Self::Rejected { status, .. } => status.is_server_error() || matches!(*status, StatusCode::REQUEST_TIMEOUT | StatusCode::TOO_MANY_REQUESTS | StatusCode::TOO_EARLY),
            Self::Unauthorized => false,
        }
    }
}

pub struct ApiUploader {
    client: Client,
    endpoint: String,
    token: String,
}

impl ApiUploader {
    pub fn new(api_url: &str, token: String) -> Result<Self, reqwest::Error> {
        Ok(Self {
            client: Client::builder().connect_timeout(Duration::from_secs(5)).timeout(Duration::from_secs(20)).user_agent("honeytrace-engine/0.1").build()?,
            endpoint: format!("{}/api/v1/analyses/ingest", api_url.trim_end_matches('/')),
            token,
        })
    }

    pub fn upload(&self, envelope: &IngestEnvelope) -> Result<(), UploadError> {
        let response = self.client.post(&self.endpoint).bearer_auth(&self.token).json(envelope).send()?;
        let status = response.status();
        if status.is_success() { return Ok(()); }
        if status == StatusCode::UNAUTHORIZED || status == StatusCode::FORBIDDEN { return Err(UploadError::Unauthorized); }
        let body = response.text().unwrap_or_default();
        Err(UploadError::Rejected { status, body: body.chars().take(512).collect() })
    }
}
