#[tauri::command]
pub fn clipboard_sequence_number() -> u32 {
    #[cfg(target_os = "windows")]
    {
        #[link(name = "user32")]
        extern "system" {
            fn GetClipboardSequenceNumber() -> u32;
        }

        // 此调用只读取序列号，不打开或修改系统剪贴板。
        unsafe { GetClipboardSequenceNumber() }
    }

    #[cfg(not(target_os = "windows"))]
    {
        0
    }
}
