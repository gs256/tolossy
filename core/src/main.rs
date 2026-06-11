pub mod conversion;
pub mod utils;
use crate::conversion::{convert_file, get_default_output_dir, get_temp_dir, is_ffmpeg_available};
use axum::{
    Json, Router,
    body::{Body, Bytes},
    extract::{DefaultBodyLimit, Path, Query, WebSocketUpgrade, ws::WebSocket},
    http::{HeaderValue, Response, StatusCode},
    response::IntoResponse,
    routing::{any, get, post},
};
use rust_embed::Embed;
use serde_json::json;
use std::{collections::HashMap, env, ffi::OsStr};
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
                _ => "text/plain".to_string(),
            };
        }
    }
    "text/plain".to_string()
}

fn get_file(path: &str) -> Option<Response<Body>> {
    match Asset::get(path) {
        Some(file) => {
            let content = String::from_utf8(file.data.into_owned()).expect("failed to read asset");
            let mut test = content.into_response();
            test.headers_mut().insert(
                "content-type",
                HeaderValue::from_str(&infer_content_type(path)).unwrap(),
            );
            Some(test)
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
    }))
}

async fn open_output_dir() -> impl IntoResponse {
    match open::that(get_default_output_dir()) {
        Ok(_) => (StatusCode::OK, "").into_response(),
        Err(err) => (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()).into_response(),
    }
}

async fn ws_handler(ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(handle_socket)
}
async fn handle_socket(mut socket: WebSocket) {
    println!("socket connected");
    while socket.recv().await.is_some() {}
    println!("socket disconnected");
}

fn create_app() -> Router {
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
        .route("/ws", any(ws_handler))
        .route("/{*path}", get(get_asset))
        .layer(cors)
        .layer(DefaultBodyLimit::max(1 * 1024 * 1024 * 1024)) // 1GB
}

#[derive(Embed)]
#[folder = "../ui/dist"]
struct Asset;

#[tokio::main]
async fn main() {
    let is_debug = env::var("DEBUG").unwrap_or_default() == "true";
    let app = create_app();

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
        .await
        .expect("failed to start server");
}

#[cfg(test)]
mod tests {
    use crate::utils::response_body_str;

    use super::*;
    use axum::{body::Body, http::Request};
    use serde_json::Value;
    use std::fs;
    use tower::ServiceExt;

    #[tokio::test]
    async fn get_state() {
        let request = Request::builder()
            .method("GET")
            .uri("/api/state")
            .body(Body::empty())
            .unwrap();

        let response = create_app().oneshot(request).await.unwrap();
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

        create_app().oneshot(request).await.unwrap();
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

            let response = create_app().oneshot(request).await.unwrap();
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

            let response = create_app().oneshot(request).await.unwrap();
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
                create_app().oneshot(request).await.unwrap();
            }
            {
                let request = Request::builder()
                    .method("GET")
                    .uri("/api/convert?name=sample.flac")
                    .body(Body::empty())
                    .unwrap();
                let response = create_app().oneshot(request).await.unwrap();
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
            let response = create_app().oneshot(request).await.unwrap();
            assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        }
    }
}
