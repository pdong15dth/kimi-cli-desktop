use tauri::{AppHandle, Manager, Runtime};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_notification::NotificationExt;

use crate::backend::{check_backend, discover_backend, normalize_backend_url, BackendInfo};

const SETTINGS_FILE: &str = "settings.json";

fn settings_path(app: &AppHandle) -> std::path::PathBuf {
    app.path()
        .app_config_dir()
        .unwrap_or_else(|_| std::env::temp_dir().join("kimi-code-desktop"))
        .join(SETTINGS_FILE)
}

fn read_settings(app: &AppHandle) -> Result<serde_json::Value, String> {
    let path = settings_path(app);
    if !path.exists() {
        return Ok(serde_json::json!({}));
    }
    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

fn write_settings(app: &AppHandle, value: serde_json::Value) -> Result<(), String> {
    let path = settings_path(app);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(&value).map_err(|e| e.to_string())?;
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

/// Get the configured backend URL from app storage.
#[tauri::command]
pub fn get_backend_url(app: AppHandle) -> Result<String, String> {
    let settings = read_settings(&app)?;
    let url = settings
        .get("backend_url")
        .and_then(|v| v.as_str().map(String::from))
        .unwrap_or_else(|| "http://127.0.0.1:5494".to_string());
    Ok(url)
}

/// Save the backend URL to app storage.
#[tauri::command]
pub fn set_backend_url(app: AppHandle, url: String) -> Result<(), String> {
    let mut settings = read_settings(&app)?;
    let normalized = normalize_backend_url(&url);
    settings["backend_url"] = serde_json::json!(normalized);
    write_settings(&app, settings)
}

/// Auto-discover a running Kimi CLI backend.
#[tauri::command]
pub async fn cmd_discover_backend() -> Result<Option<BackendInfo>, String> {
    Ok(discover_backend().await)
}

/// Check if a backend is healthy at the given URL.
#[tauri::command]
pub async fn cmd_check_backend(url: String) -> Result<BackendInfo, String> {
    let normalized = normalize_backend_url(&url);
    check_backend(&normalized)
        .await
        .ok_or_else(|| format!("Backend at {} is not reachable", normalized))
}

/// Open the native file picker and return selected paths.
#[tauri::command]
pub async fn pick_files<R: Runtime>(
    app: AppHandle<R>,
    multiple: bool,
) -> Result<Vec<String>, String> {
    let dialog = app.dialog();
    let file_paths = if multiple {
        dialog
            .file()
            .blocking_pick_files()
            .unwrap_or_default()
            .into_iter()
            .filter_map(|f| f.into_path().ok().map(|p| p.to_string_lossy().to_string()))
            .collect()
    } else {
        dialog
            .file()
            .blocking_pick_file()
            .and_then(|f| {
                f.into_path()
                    .ok()
                    .map(|p| vec![p.to_string_lossy().to_string()])
            })
            .unwrap_or_default()
    };
    Ok(file_paths)
}

/// Show a native desktop notification.
#[tauri::command]
pub fn show_notification(app: AppHandle, title: String, body: String) -> Result<(), String> {
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|e| format!("Failed to show notification: {}", e))?;
    Ok(())
}

/// Get the application version.
#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Open a native folder picker and return the selected path.
#[tauri::command]
pub fn pick_project_folder<R: Runtime>(app: AppHandle<R>) -> Result<Option<String>, String> {
    let dialog = app.dialog();
    let path = dialog
        .file()
        .blocking_pick_folder()
        .and_then(|f| f.into_path().ok().map(|p| p.to_string_lossy().to_string()));
    Ok(path)
}
