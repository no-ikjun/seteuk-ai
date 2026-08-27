mod commands;
mod config;
mod error;
#[cfg(target_os = "macos")]
mod install;
mod models;
mod openai;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // DMG에서 Applications로 옮긴 직후 실행된 경우, 원본 볼륨을 꺼내고
    // 설치 파일을 휴지통으로 옮긴다. 창을 만들기 전에 끝낸다.
    #[cfg(target_os = "macos")]
    install::run_pending_cleanup();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|_app| {
            #[cfg(target_os = "macos")]
            install::offer_move_to_applications(_app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::generate::generate,
            commands::generate::revise_length,
            commands::models::list_models
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
