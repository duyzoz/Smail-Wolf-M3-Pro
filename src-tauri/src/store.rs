//! Small key/value JSON store backed by a file in the Tauri app-data dir.
//!
//! Contract (do not rename — the battery workstream depends on it):
//! battery state lives under key `"battery-state-v1"`, JSON shape
//! `{ remaining_mah, last_polling_rate, updated_at (unix seconds),
//!    charging, low_notified, saver }`.
//!
//! Values are stored as opaque strings so the frontend owns the schema.

use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

/// Serializes store file access so concurrent `store_set` calls can't race.
pub struct StoreLock(pub Mutex<()>);

const STORE_FILE: &str = "store.json";

fn store_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir unavailable: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("cannot create app-data dir: {e}"))?;
    Ok(dir.join(STORE_FILE))
}

fn read_map(app: &AppHandle) -> Result<HashMap<String, String>, String> {
    let path = store_path(app)?;
    match fs::read_to_string(&path) {
        Ok(text) => serde_json::from_str(&text)
            .map_err(|e| format!("store file corrupt ({}): {e}", path.display())),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(HashMap::new()),
        Err(e) => Err(format!("cannot read store file: {e}")),
    }
}

fn write_map(app: &AppHandle, map: &HashMap<String, String>) -> Result<(), String> {
    let path = store_path(app)?;
    let text = serde_json::to_string_pretty(map).map_err(|e| format!("serialize store: {e}"))?;
    // Write atomically-ish: temp file + rename, so a crash can't half-write it.
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, text).map_err(|e| format!("cannot write store file: {e}"))?;
    fs::rename(&tmp, &path).map_err(|e| format!("cannot commit store file: {e}"))?;
    Ok(())
}

/// Read one value by key. Returns `None` when the key (or the file) is absent.
#[tauri::command]
pub fn store_get(
    app: AppHandle,
    lock: State<'_, StoreLock>,
    key: String,
) -> Result<Option<String>, String> {
    let _guard = lock
        .0
        .lock()
        .map_err(|e| format!("store lock poisoned: {e}"))?;
    Ok(read_map(&app)?.get(&key).cloned())
}

/// Write one value by key (creates the file/dir when missing).
#[tauri::command]
pub fn store_set(
    app: AppHandle,
    lock: State<'_, StoreLock>,
    key: String,
    value: String,
) -> Result<(), String> {
    let _guard = lock
        .0
        .lock()
        .map_err(|e| format!("store lock poisoned: {e}"))?;
    let mut map = read_map(&app)?;
    map.insert(key, value);
    write_map(&app, &map)
}

/// Non-command helpers for first-run setup in `main.rs` (no lock needed there
/// — setup runs before any command can be invoked).
pub fn get_value(app: &AppHandle, key: &str) -> Option<String> {
    read_map(app).ok()?.get(key).cloned()
}

pub fn set_value(app: &AppHandle, key: &str, value: String) -> Result<(), String> {
    let mut map = read_map(app)?;
    map.insert(key.to_string(), value);
    write_map(app, &map)
}
