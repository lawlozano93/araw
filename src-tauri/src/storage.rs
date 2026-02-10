use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Get the Araw data directory
fn get_data_dir() -> PathBuf {
    let home = dirs::home_dir().expect("Could not find home directory");
    home.join("Documents").join("Araw")
}

/// Ensure all required directories exist
fn ensure_dirs() -> Result<(), String> {
    let base = get_data_dir();
    let dirs = vec![
        base.clone(),
        base.join("entries"),
        base.join("pages"),
    ];
    
    for dir in dirs {
        if !dir.exists() {
            fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

/// Read a file's contents
#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    ensure_dirs()?;
    let full_path = get_data_dir().join(&path);
    
    if full_path.exists() {
        fs::read_to_string(&full_path).map_err(|e| e.to_string())
    } else {
        Ok(String::new())
    }
}

/// Write content to a file
#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    ensure_dirs()?;
    let full_path = get_data_dir().join(&path);
    
    // Ensure parent directory exists
    if let Some(parent) = full_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    
    fs::write(&full_path, content).map_err(|e| e.to_string())
}

/// List files in a directory
#[tauri::command]
pub fn list_files(dir: String) -> Result<Vec<String>, String> {
    ensure_dirs()?;
    let full_path = get_data_dir().join(&dir);
    
    if !full_path.exists() {
        return Ok(vec![]);
    }
    
    let entries = fs::read_dir(&full_path).map_err(|e| e.to_string())?;
    let mut files = vec![];
    
    for entry in entries {
        if let Ok(entry) = entry {
            if let Some(name) = entry.file_name().to_str() {
                files.push(name.to_string());
            }
        }
    }
    
    files.sort();
    files.reverse(); // Most recent first
    Ok(files)
}

/// Delete a file
#[tauri::command]
pub fn delete_file(path: String) -> Result<(), String> {
    let full_path = get_data_dir().join(&path);
    
    if full_path.exists() {
        fs::remove_file(&full_path).map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}

/// Get the base data directory path
#[tauri::command]
pub fn get_data_path() -> String {
    get_data_dir().to_string_lossy().to_string()
}
