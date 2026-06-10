use std::ffi::OsStr;

use axum::{
    Router,
    body::Body,
    extract::Path,
    http::{HeaderValue, Response, StatusCode},
    response::IntoResponse,
    routing::get,
};
use rust_embed::Embed;

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

fn create_app() -> Router {
    Router::new()
        .route("/", get(index))
        .route("/{*path}", get(get_asset))
}

#[derive(Embed)]
#[folder = "../ui/dist"]
struct Asset;

#[tokio::main]
async fn main() {
    let app = create_app();
    let listener = tokio::net::TcpListener::bind(HOST)
        .await
        .expect("failed to bind tcp listener");

    println!("Server running http://{HOST}");

    axum::serve(listener, app)
        .await
        .expect("failed to start server");
}
