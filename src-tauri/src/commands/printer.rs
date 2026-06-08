/// Returns names of installed printers visible to Windows.
/// Used by the frontend to let the user select a thermal printer.
#[tauri::command]
pub fn list_printers() -> Vec<String> {
    #[cfg(target_os = "windows")]
    {
        let Ok(output) = std::process::Command::new("powershell")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                "Get-Printer | Select-Object -ExpandProperty Name",
            ])
            .output()
        else {
            return vec![];
        };

        String::from_utf8_lossy(&output.stdout)
            .lines()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect()
    }

    #[cfg(not(target_os = "windows"))]
    {
        // macOS / Linux — lpstat -p
        let Ok(output) = std::process::Command::new("lpstat").args(["-p"]).output() else {
            return vec![];
        };

        String::from_utf8_lossy(&output.stdout)
            .lines()
            .filter_map(|l| l.split_whitespace().nth(1).map(str::to_string))
            .collect()
    }
}
