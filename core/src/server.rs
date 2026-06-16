use crate::common::AppState;
use crate::conversion::clear_temp_dir;
use crate::conversion::{convert_file, get_default_output_dir, get_temp_dir, is_ffmpeg_available};
use crate::utils::{cancel_shutdown, infer_mime_type, is_binary, schedule_shutdown};
use axum::body::{Body, Bytes};
use axum::extract::{DefaultBodyLimit, Path, Query, State, WebSocketUpgrade};
use axum::http::{HeaderValue, Response, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{any, get, post};
use axum::{Json, Router};
use rust_embed::Embed;
use serde_json::json;
use std::collections::HashMap;
use tower_http::cors::{Any, CorsLayer};

pub const HOST: &str = "127.0.0.1:2479";

#[derive(Embed)]
#[folder = "../ui/dist"]
struct Asset;

async fn index_handler() -> impl IntoResponse {
    match get_file("index.html") {
        Some(response) => response,
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

async fn asset_handler(Path(path): Path<String>) -> impl IntoResponse {
    match get_file(&path) {
        Some(response) => response,
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

fn get_file(path: &str) -> Option<Response<Body>> {
    Asset::get(path).map(|file| {
        let mut response =
            if is_binary(path).unwrap_or_else(|| panic!("failed binary check '{}'", path)) {
                file.data.into_owned().into_response()
            } else {
                String::from_utf8(file.data.into_owned())
                    .expect("failed to read asset")
                    .into_response()
            };
        response.headers_mut().insert(
            "content-type",
            HeaderValue::from_str(
                &infer_mime_type(path)
                    .unwrap_or_else(|| panic!("failed to infer MIME type '{}'", path)),
            )
            .unwrap(),
        );
        response
    })
}

async fn upload_handler(
    Query(params): Query<HashMap<String, String>>,
    body: Bytes,
) -> impl IntoResponse {
    let filename = params.get("name").map(|s| s.as_str()).unwrap_or_default();
    if filename.is_empty() {
        return (StatusCode::BAD_REQUEST, "empty filename").into_response();
    }
    let temp_filepath = get_temp_dir().join(filename);
    std::fs::write(temp_filepath, &body).unwrap();
    return "done".into_response();
}

async fn convert_handler(Query(params): Query<HashMap<String, String>>) -> impl IntoResponse {
    let filename = params.get("name").map(|s| s.as_str()).unwrap_or_default();
    if filename.is_empty() {
        return (StatusCode::BAD_REQUEST, "empty filename").into_response();
    }
    let temp_filepath = get_temp_dir().join(filename);
    if !temp_filepath.exists() {
        return (StatusCode::BAD_REQUEST, "file does not exist").into_response();
    }
    let result = convert_file(
        temp_filepath.to_str().unwrap(),
        get_default_output_dir().to_str().unwrap(),
    );
    match result {
        Ok(output) => {
            return (StatusCode::OK, output).into_response();
        }
        Err(output) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, output).into_response();
        }
    };
}

async fn get_state_handler() -> impl IntoResponse {
    let ffmpeg_available = is_ffmpeg_available();
    Json(json!({
        "ffmpegAvailable": ffmpeg_available,
        "outputPath": get_default_output_dir(),
    }))
}

async fn open_output_dir_handler() -> impl IntoResponse {
    match open::that(get_default_output_dir()) {
        Ok(_) => (StatusCode::OK, "").into_response(),
        Err(err) => (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()).into_response(),
    }
}

async fn cleanup_handler() -> impl IntoResponse {
    clear_temp_dir();
}

async fn shutdown_handler(State(state): State<AppState>) -> impl IntoResponse {
    clear_temp_dir();
    _ = state.shutdown_channel.send(true);
}

async fn ws_handler(ws: WebSocketUpgrade, State(state): State<AppState>) -> impl IntoResponse {
    ws.on_upgrade(|mut socket| async move {
        cancel_shutdown(&state);

        while socket.recv().await.is_some() {}

        clear_temp_dir();
        schedule_shutdown(&state);
    })
}

pub fn create_app(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/", get(index_handler))
        .route("/api/state", get(get_state_handler))
        .route("/api/upload", post(upload_handler))
        .route("/api/convert", get(convert_handler))
        .route("/api/open-output-dir", get(open_output_dir_handler))
        .route("/api/cleanup", get(cleanup_handler))
        .route("/api/shutdown", get(shutdown_handler))
        .route("/ws", any(ws_handler))
        .route("/{*path}", get(asset_handler))
        .layer(cors)
        .layer(DefaultBodyLimit::max(1 * 1024 * 1024 * 1024)) // 1GB
        .with_state(state)
}

#[cfg(test)]
#[path = "tests/server_tests.rs"]
mod server_tests;
