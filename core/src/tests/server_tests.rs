use crate::utils::response_body_str;
use crate::{common::AppState, server::create_app};
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
};
use serde_json::Value;
use std::{fs, sync::Arc, sync::RwLock};
use tokio::sync::watch;
use tower::ServiceExt;

fn mock_app() -> Router {
    let state = AppState {
        shutdown_channel: watch::channel(false).0,
        task: Arc::new(RwLock::new(None)),
    };
    create_app(state)
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
    use crate::conversion::get_temp_dir;

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
