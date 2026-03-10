use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use once_cell::sync::Lazy;

/// Custom vault path override (set via set_vault_path command)
static VAULT_PATH: Lazy<Mutex<Option<PathBuf>>> = Lazy::new(|| Mutex::new(None));

/// Get the Araw data directory, using custom vault path if set
fn get_data_dir() -> Result<PathBuf, String> {
    // Check for custom vault path first
    let vault = VAULT_PATH.lock().map_err(|e| format!("Lock error: {}", e))?;
    if let Some(ref custom_path) = *vault {
        return Ok(custom_path.clone());
    }

    // Default: ~/Documents/Araw
    let home = dirs::home_dir()
        .ok_or_else(|| "Could not find home directory".to_string())?;
    Ok(home.join("Documents").join("Araw"))
}

/// Validate that a path doesn't escape the base directory (path traversal protection)
fn validate_path(base: &std::path::Path, requested: &str) -> Result<PathBuf, String> {
    // Reject obviously malicious paths
    if requested.contains("..") {
        return Err("Path traversal detected: '..' not allowed".to_string());
    }

    let full_path = base.join(requested);

    // Canonicalize base (create it first if needed so canonicalize works)
    let canonical_base = if base.exists() {
        base.canonicalize().map_err(|e| format!("Failed to resolve base path: {}", e))?
    } else {
        fs::create_dir_all(base).map_err(|e| format!("Failed to create base directory: {}", e))?;
        base.canonicalize().map_err(|e| format!("Failed to resolve base path: {}", e))?
    };

    // For files that don't exist yet, check the parent
    if full_path.exists() {
        let canonical_full = full_path.canonicalize()
            .map_err(|e| format!("Failed to resolve path: {}", e))?;
        if !canonical_full.starts_with(&canonical_base) {
            return Err("Path traversal detected: path escapes vault directory".to_string());
        }
        Ok(canonical_full)
    } else {
        // File doesn't exist yet — validate the parent directory
        if let Some(parent) = full_path.parent() {
            if parent.exists() {
                let canonical_parent = parent.canonicalize()
                    .map_err(|e| format!("Failed to resolve parent path: {}", e))?;
                if !canonical_parent.starts_with(&canonical_base) {
                    return Err("Path traversal detected: path escapes vault directory".to_string());
                }
            }
            // Parent doesn't exist yet — it will be created, and since we
            // already rejected ".." above, the join is safe
        }
        Ok(full_path)
    }
}

/// Ensure all required directories exist
fn ensure_dirs() -> Result<(), String> {
    let base = get_data_dir()?;
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
    let base = get_data_dir()?;
    let full_path = validate_path(&base, &path)?;

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
    let base = get_data_dir()?;
    let full_path = validate_path(&base, &path)?;

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
    let base = get_data_dir()?;
    let full_path = validate_path(&base, &dir)?;

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
    let base = get_data_dir()?;
    let full_path = validate_path(&base, &path)?;

    if full_path.exists() {
        fs::remove_file(&full_path).map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}

/// Get the base data directory path
#[tauri::command]
pub fn get_data_path() -> Result<String, String> {
    Ok(get_data_dir()?.to_string_lossy().to_string())
}

/// Set a custom vault path (for Obsidian-style sync)
#[tauri::command]
pub fn set_vault_path(path: String) -> Result<(), String> {
    let new_path = PathBuf::from(&path);

    // Validate the path exists and is a directory
    if !new_path.exists() {
        fs::create_dir_all(&new_path)
            .map_err(|e| format!("Failed to create vault directory: {}", e))?;
    }

    if !new_path.is_dir() {
        return Err("Vault path must be a directory".to_string());
    }

    let mut vault = VAULT_PATH.lock().map_err(|e| format!("Lock error: {}", e))?;
    *vault = Some(new_path);

    Ok(())
}

/// Get the current vault path
#[tauri::command]
pub fn get_vault_path() -> Result<String, String> {
    Ok(get_data_dir()?.to_string_lossy().to_string())
}

/// Reset all data by deleting the vault directory
#[tauri::command]
pub fn reset_data() -> Result<(), String> {
    let base = get_data_dir()?;
    if base.exists() {
        fs::remove_dir_all(&base).map_err(|e| format!("Failed to delete data: {}", e))?;
    }
    // Recreate the empty directory structure
    ensure_dirs()?;
    Ok(())
}
