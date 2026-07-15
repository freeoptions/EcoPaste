use tauri::{AppHandle, WebviewWindow};

mod windows;

pub use windows::*;

pub fn default(
    app_handle: &AppHandle,
    main_window: WebviewWindow,
    preference_window: WebviewWindow,
) {
    // 开发模式自动打开控制台：https://tauri.app/develop/debug
    #[cfg(debug_assertions)]
    main_window.open_devtools();

    platform(app_handle, main_window.clone(), preference_window.clone());
}
