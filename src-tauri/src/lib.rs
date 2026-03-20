mod storage;

use storage::{read_file, write_file, list_files, delete_file, get_data_path, set_vault_path, get_vault_path, reset_data};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn show_main_window(window: tauri::Window) {
    if let Some(main_window) = window.get_webview_window("main") {
        let _ = main_window.show();
        let _ = main_window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Create tray menu
            let show = MenuItem::with_id(app, "show", "Open Araw", true, None::<&str>)?;
            let start_session = MenuItem::with_id(app, "start_session", "Start Session", true, None::<&str>)?;
            let separator = MenuItem::with_id(app, "sep", "─────────────", false, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            
            let menu = Menu::with_items(app, &[&show, &start_session, &separator, &quit])?;
            
            // Build tray icon
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "start_session" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.emit("start-session", ());
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        rect,
                        position,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("tray") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible {
                                let _ = window.hide();
                            } else {
                                // Position window near tray icon
                                // Use position from event (PhysicalPosition)
                                // Standard tray icon size is often around 22-24px height on macOS
                                
                                // Default width/height of tray window
                                let window_width = 300.0;
                                let _window_height = 400.0;

                                // Basic centering logic for macOS menu bar
                                let x = position.x as f64 - (window_width / 2.0);
                                // Position below the click (menu bar)
                                // Add a fixed offset since we can't easily get rect height
                                let y = position.y as f64 + 30.0; // 30px offset

                                let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                                    x: x as i32,
                                    y: y as i32, 
                                }));
                                
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            show_main_window,
            read_file,
            write_file,
            list_files,
            delete_file,
            get_data_path,
            set_vault_path,
            get_vault_path,
            reset_data
        ])
        .on_window_event(|window, event| {
            // macOS "close" should behave like "hide to tray" to match your custom X button.
            // Note: tray "Quit" still calls `app.exit(0)` which should terminate the process.
            if cfg!(target_os = "macos") {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| {
            match event {
                #[cfg(target_os = "macos")]
                tauri::RunEvent::Reopen { has_visible_windows, .. } => {
                    if !has_visible_windows {
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
                _ => {}
            }
        });
}
