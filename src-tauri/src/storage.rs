use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use once_cell::sync::Lazy;
use serde_json::{json, Value};

/// Custom vault path override (set via set_vault_path command)
static VAULT_PATH: Lazy<Mutex<Option<PathBuf>>> = Lazy::new(|| Mutex::new(None));

/// Default base directory (`~/Documents/Araw`) used as a stable place to persist vault settings.
fn get_default_base_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir()
        .ok_or_else(|| "Could not find home directory".to_string())?;
    Ok(home.join("Documents").join("Araw"))
}

/// Best-effort read of `vaultPath` from the default config file.
/// This is used to restore the vault override after app restarts.
fn load_vault_path_from_default_config() -> Result<Option<PathBuf>, String> {
    let default_base = get_default_base_dir()?;
    let config_path = default_base.join("config.json");
    if !config_path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    if content.trim().is_empty() {
        return Ok(None);
    }

    let v: Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    let vault_path = v
        .get("vaultPath")
        .and_then(|x| x.as_str())
        .map(|s| PathBuf::from(s));

    if let Some(p) = vault_path {
        if p.exists() && p.is_dir() {
            return Ok(Some(p));
        }
    }

    Ok(None)
}

/// Get the Araw data directory, using custom vault path if set
fn get_data_dir() -> Result<PathBuf, String> {
    // Check for custom vault path first
    let mut vault = VAULT_PATH.lock().map_err(|e| format!("Lock error: {}", e))?;
    if let Some(ref custom_path) = *vault {
        return Ok(custom_path.clone());
    }

    // If no override is set yet, try to restore it from the default config.
    if vault.is_none() {
        if let Some(restored) = load_vault_path_from_default_config()? {
            *vault = Some(restored.clone());
            return Ok(restored);
        }
    }

    // Default: ~/Documents/Araw
    Ok(get_default_base_dir()?)
}

/// Validate that a path doesn't escape the base directory (path traversal protection)
fn validate_path(base: &std::path::Path, requested: &str) -> Result<PathBuf, String> {
    // Reject absolute paths early (prevents `base.join(absolute)` from escaping the base).
    // This applies to both macOS and Windows.
    let req_path = std::path::Path::new(requested);
    if req_path.is_absolute() {
        return Err("Absolute paths are not allowed".to_string());
    }

    // Windows drive-letter paths (e.g. `C:foo`) are technically "relative" in Rust on non-Windows,
    // but they should never be accepted.
    let bytes = requested.as_bytes();
    if bytes.len() >= 2 && bytes[1] == b':' && (bytes[0] as char).is_ascii_alphabetic() {
        return Err("Drive-letter paths are not allowed".to_string());
    }

    // Block traversal via path components (works regardless of path separator style).
    for comp in req_path.components() {
        match comp {
            std::path::Component::ParentDir => {
                return Err("Path traversal detected: '..' not allowed".to_string())
            }
            std::path::Component::Prefix(_) | std::path::Component::RootDir => {
                return Err("Unsupported path prefix".to_string())
            }
            _ => {}
        }
    }

    let full_path = base.join(req_path);

    // Canonicalize base (create it first if needed so canonicalize works)
    let canonical_base = if base.exists() {
        base.canonicalize().map_err(|e| format!("Failed to resolve base path: {}", e))?
    } else {
        fs::create_dir_all(base).map_err(|e| format!("Failed to create base directory: {}", e))?;
        base.canonicalize().map_err(|e| format!("Failed to resolve base path: {}", e))?
    };

    // If the target exists, canonicalize and ensure it stays under the canonical base.
    // For non-existent paths we rely on the earlier component checks + the fact that
    // we only accept relative, non-traversal paths.
    if full_path.exists() {
        let canonical_full = full_path
            .canonicalize()
            .map_err(|e| format!("Failed to resolve path: {}", e))?;
        if !canonical_full.starts_with(&canonical_base) {
            return Err("Path traversal detected: path escapes vault directory".to_string());
        }
        Ok(canonical_full)
    } else {
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
    let new_path_str = new_path.to_string_lossy().to_string();

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

    // Persist the selected vault path into the default config so we can restore it
    // on next app start (even though `VAULT_PATH` itself is in-memory).
    let default_base = get_default_base_dir()?;
    let default_config_path = default_base.join("config.json");
    if !default_base.exists() {
        fs::create_dir_all(&default_base).map_err(|e| e.to_string())?;
    }

    let mut config: Value = json!({
        "theme": "light",
        "currentStreak": 0,
        "lastSessionDate": "",
        "sessions": {},
        "onboardingComplete": false,
        "vaultPath": new_path_str
    });

    if default_config_path.exists() {
        if let Ok(existing) = fs::read_to_string(&default_config_path) {
            if let Ok(existing_json) = serde_json::from_str::<Value>(&existing) {
                config = existing_json;
            }
        }
    }

    config["vaultPath"] = Value::String(new_path_str);
    fs::write(&default_config_path, serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

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
