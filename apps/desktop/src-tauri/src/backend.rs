use serde::{Deserialize, Serialize};
use std::time::Duration;

const DEFAULT_BACKEND_URL: &str = "http://127.0.0.1:5494";
const HEALTH_ENDPOINT: &str = "/api/config/";
const DISCOVERY_TIMEOUT: Duration = Duration::from_secs(2);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackendInfo {
    pub url: String,
    pub version: Option<String>,
    pub healthy: bool,
}

/// Discover a running Kimi CLI backend server.
/// First tries the default URL, then scans nearby ports (5495-5504).
pub async fn discover_backend() -> Option<BackendInfo> {
    // Try default URL first
    if let Some(info) = check_backend(DEFAULT_BACKEND_URL).await {
        return Some(info);
    }

    // Scan nearby ports
    for port in 5495..=5504 {
        let url = format!("http://127.0.0.1:{}", port);
        if let Some(info) = check_backend(&url).await {
            return Some(info);
        }
    }

    None
}

/// Check if a backend is healthy at the given URL.
pub async fn check_backend(url: &str) -> Option<BackendInfo> {
    let client = match reqwest::Client::builder()
        .timeout(DISCOVERY_TIMEOUT)
        .build()
    {
        Ok(c) => c,
        Err(_) => return None,
    };

    let health_url = format!("{}{}", url.trim_end_matches('/'), HEALTH_ENDPOINT);
    match client.get(&health_url).send().await {
        Ok(response) if response.status().is_success() => Some(BackendInfo {
            url: url.to_string(),
            version: None,
            healthy: true,
        }),
        _ => None,
    }
}

/// Validate and normalize a backend URL.
pub fn normalize_backend_url(url: &str) -> String {
    let url = url.trim();
    if url.is_empty() {
        return DEFAULT_BACKEND_URL.to_string();
    }
    let url = if url.starts_with("http://") || url.starts_with("https://") {
        url.to_string()
    } else {
        format!("http://{}", url)
    };
    url.trim_end_matches('/').to_string()
}
