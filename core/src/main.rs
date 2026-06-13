pub mod conversion;
pub mod utils;
use crate::conversion::{
    clear_temp_dir, convert_file, get_default_output_dir, get_temp_dir, is_ffmpeg_available,
};
use axum::{
    Json, Router,
    body::{Body, Bytes},
    extract::{DefaultBodyLimit, Path, Query, State, WebSocketUpgrade, ws::WebSocket},
    http::{HeaderValue, Response, StatusCode},
    response::IntoResponse,
    routing::{any, get, post},
};
use rust_embed::Embed;
use serde_json::json;
use std::{collections::HashMap, env, ffi::OsStr, sync::Arc, time::Duration};
use tokio::{
    sync::{
        Mutex,
        watch::{self, Sender},
    },
    time::sleep,
};
use tower_http::cors::{Any, CorsLayer};

const HOST: &str = "127.0.0.1:2479";

async fn index() -> impl IntoResponse {
    match get_file("index.html") {
        Some(response) => response,
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

async fn get_asset(Path(path): Path<String>) -> impl IntoResponse {
    match get_file(&path) {
        Some(response) => response,
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

fn infer_content_type(path: &str) -> String {
    let split = path.split(".");
    if split.count() > 1 {
        let extension = std::path::Path::new(path)
            .extension()
            .and_then(OsStr::to_str);
        if let Some(test) = extension {
            match test {
                "html" => return "text/html".to_string(),
                "js" => return "text/javascript".to_string(),
                "css" => return "text/css".to_string(),
                "svg" => return "image/svg+xml".to_string(),
                "woff2" => return "font/woff2".to_string(),
                _ => "text/plain".to_string(),
            };
        }
    }
    "text/plain".to_string()
}

fn is_binary(path: &str) -> bool {
    let extension = std::path::Path::new(path)
        .extension()
        .and_then(OsStr::to_str);
    if let Some(test) = extension {
        match test {
            "woff2" => return true,
            "woff" => return true,
            "ttf" => return true,
            "otf" => return true,
            "png" => return true,
            "jpg" => return true,
            "jpeg" => return true,
            _ => return false,
        };
    }
    return false;
}

fn get_file(path: &str) -> Option<Response<Body>> {
    match Asset::get(path) {
        Some(file) => {
            let mut response = if is_binary(path) {
                file.data.into_owned().into_response()
            } else {
                String::from_utf8(file.data.into_owned())
                    .expect("failed to read asset")
                    .into_response()
            };
            response.headers_mut().insert(
                "content-type",
                HeaderValue::from_str(&infer_content_type(path)).unwrap(),
            );
            Some(response)
        }
        None => None,
    }
}

async fn upload(Query(params): Query<HashMap<String, String>>, body: Bytes) -> impl IntoResponse {
    let filename = params.get("name").map(|s| s.as_str()).unwrap_or_default();
    if filename.is_empty() {
        return (StatusCode::BAD_REQUEST, "empty filename").into_response();
    }
    let temp_filepath = get_temp_dir().join(filename);
    std::fs::write(temp_filepath, &body).unwrap();
    return "done".into_response();
}

async fn convert(Query(params): Query<HashMap<String, String>>) -> impl IntoResponse {
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

async fn get_state() -> impl IntoResponse {
    let ffmpeg_available = is_ffmpeg_available();
    Json(json!({
        "ffmpegAvailable": ffmpeg_available,
        "outputPath": get_default_output_dir(),
    }))
}

async fn open_output_dir() -> impl IntoResponse {
    match open::that(get_default_output_dir()) {
        Ok(_) => (StatusCode::OK, "").into_response(),
        Err(err) => (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()).into_response(),
    }
}

async fn cleanup() -> impl IntoResponse {
    clear_temp_dir();
}

async fn ws_handler(ws: WebSocketUpgrade, State(state): State<AppState>) -> impl IntoResponse {
    ws.on_upgrade(|ws| handle_socket(ws, state))
}

async fn handle_socket(mut socket: WebSocket, state: AppState) {
    *state.connected.lock().await = true;

    while socket.recv().await.is_some() {}

    *state.connected.lock().await = false;
    clear_temp_dir();
    schedule_shutdown(&state).await;
}

fn create_app(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/", get(index))
        .route("/api/state", get(get_state))
        .route("/api/upload", post(upload))
        .route("/api/convert", get(convert))
        .route("/api/open-output-dir", get(open_output_dir))
        .route("/api/cleanup", get(cleanup))
        .route("/ws", any(ws_handler))
        .route("/{*path}", get(get_asset))
        .layer(cors)
        .layer(DefaultBodyLimit::max(1 * 1024 * 1024 * 1024)) // 1GB
        .with_state(state)
}

async fn schedule_shutdown(state: &AppState) {
    let tx = state.shutdown_channel.clone();
    let connected = state.connected.clone();

    tokio::spawn({
        async move {
            sleep(Duration::from_secs(2)).await;

            let test = *connected.lock().await;
            if !test {
                println!("sending shutdown signal...");
                let _ = tx.send(true);
            } else {
                println!("refused to shutdown");
            }
        }
    });
}

#[derive(Clone)]
struct AppState {
    shutdown_channel: Sender<bool>,
    connected: Arc<Mutex<bool>>,
}

#[derive(Embed)]
#[folder = "../ui/dist"]
struct Asset;

#[tokio::main]
async fn main() {
    let is_debug = env::var("DEBUG").unwrap_or_default() == "true";
    let state = AppState {
        shutdown_channel: watch::channel(false).0,
        connected: Arc::new(Mutex::new(false)),
    };
    let shutdown_rx = state.shutdown_channel.subscribe();
    let app = create_app(state);

    let listener = tokio::net::TcpListener::bind(HOST)
        .await
        .expect("failed to bind tcp listener");

    let local_addr = format!("http://{}", listener.local_addr().unwrap());

    println!("DEBUG: {is_debug}");
    println!("Server running {local_addr}");

    if !is_debug {
        _ = open::that_detached(local_addr.to_string());
    }

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal(shutdown_rx))
        .await
        .expect("failed to start server");

    println!("Server shutdown")
}

async fn shutdown_signal(mut rx: watch::Receiver<bool>) {
    loop {
        if *rx.borrow() {
            break;
        }

        if rx.changed().await.is_err() {
            break;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::response_body_str;
    use axum::{body::Body, http::Request};
    use serde_json::Value;
    use std::fs;
    use tower::ServiceExt;

    fn mock_app() -> Router {
        let state = AppState {
            shutdown_channel: watch::channel(false).0,
            connected: Arc::new(Mutex::new(true)),
        };
        return create_app(state);
    }

    #[tokio::test]
    async fn cleanup() {
        let request = Request::builder()
            .method("GET")
            .uri("/api/cleanup")
            .body(Body::empty())
            .unwrap();

        let response = mock_app().oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK)
    }

    #[tokio::test]
    async fn get_state() {
        let request = Request::builder()
            .method("GET")
            .uri("/api/state")
            .body(Body::empty())
            .unwrap();

        let response = mock_app().oneshot(request).await.unwrap();
        let str = response_body_str(response.into_body()).await;
        let json: Value = serde_json::from_slice(str.as_bytes()).unwrap();
        assert_eq!(json["ffmpegAvailable"], true)
    }

    #[tokio::test]
    #[ignore]
    async fn open_output_dir() {
        let request = Request::builder()
            .method("GET")
            .uri("/api/open-output-dir")
            .body(Body::empty())
            .unwrap();

        mock_app().oneshot(request).await.unwrap();
    }

    mod upload {
        use super::*;

        #[tokio::test]
        async fn upload_success() {
            let request = Request::builder()
                .method("POST")
                .uri("/api/upload?name=test")
                .header("content-type", "application/octet-stream")
                .body(Body::from(fs::read("local/sample.flac").unwrap()))
                .unwrap();

            let response = mock_app().oneshot(request).await.unwrap();
            assert_eq!(response.status(), StatusCode::OK);
            assert!(get_temp_dir().join("test").exists())
        }

        #[tokio::test]
        async fn upload_no_name() {
            let request = Request::builder()
                .method("POST")
                .uri("/api/upload")
                .header("content-type", "application/octet-stream")
                .body(Body::empty())
                .unwrap();

            let response = mock_app().oneshot(request).await.unwrap();
            assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        }
    }

    mod upload_and_convert {
        use super::*;

        #[tokio::test]
        async fn success() {
            {
                let request = Request::builder()
                    .method("POST")
                    .uri("/api/upload?name=sample.flac")
                    .header("content-type", "application/octet-stream")
                    .body(Body::from(fs::read("local/sample.flac").unwrap()))
                    .unwrap();
                mock_app().oneshot(request).await.unwrap();
            }
            {
                let request = Request::builder()
                    .method("GET")
                    .uri("/api/convert?name=sample.flac")
                    .body(Body::empty())
                    .unwrap();
                let response = mock_app().oneshot(request).await.unwrap();
                assert_eq!(response.status(), StatusCode::OK);
            }
        }

        #[tokio::test]
        async fn non_existent_file() {
            let request = Request::builder()
                .method("GET")
                .uri("/api/convert?name=non_existent.flac")
                .body(Body::empty())
                .unwrap();
            let response = mock_app().oneshot(request).await.unwrap();
            assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        }
    }
}
