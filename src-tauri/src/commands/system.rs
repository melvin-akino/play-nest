use tauri::Manager;

/// Exposes the Tauri app-data directory path to the frontend.
/// Useful for showing the user where their database file is stored.
#[tauri::command]
pub fn get_app_data_path(app: tauri::AppHandle) -> Result<String, String> {
    app.path()
        .app_data_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}
