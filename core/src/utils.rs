use crate::common::AppState;
use axum::body::{self, Body};
use std::{ffi::OsStr, time::Duration};
use tokio::{sync::watch, time::sleep};

pub async fn response_body_str(body: Body) -> String {
    let bytes = body::to_bytes(body, usize::MAX).await.unwrap();
    let text = String::from_utf8(bytes.to_vec()).unwrap();
    return text;
}

pub async fn shutdown_signal(mut rx: watch::Receiver<bool>) {
    loop {
        if *rx.borrow() {
            break;
        }

        if rx.changed().await.is_err() {
            break;
        }
    }
}

pub fn schedule_shutdown(state: &AppState) {
    let tx = state.shutdown_channel.clone();

    let task = tokio::spawn({
        async move {
            sleep(Duration::from_secs(2)).await;
            _ = tx.send(true);
        }
    });

    if let Some(test2) = state.task.read().unwrap().as_ref() {
        test2.abort();
    }
    *state.task.write().unwrap() = Some(task);
}

pub fn cancel_shutdown(state: &AppState) {
    if let Some(test2) = state.task.read().unwrap().as_ref() {
        test2.abort();
    }
}

pub fn infer_mime_type(path: &str) -> Option<String> {
    let split = path.split(".");
    if split.count() > 1 {
        let extension = std::path::Path::new(path)
            .extension()
            .and_then(OsStr::to_str);
        if let Some(test) = extension {
            match test {
                "html" => return Some("text/html".to_string()),
                "js" => return Some("text/javascript".to_string()),
                "css" => return Some("text/css".to_string()),
                "svg" => return Some("image/svg+xml".to_string()),
                "woff2" => return Some("font/woff2".to_string()),
                _ => return None,
            };
        }
    }
    None
}

pub fn is_binary(path: &str) -> Option<bool> {
    let extension = std::path::Path::new(path)
        .extension()
        .and_then(OsStr::to_str);
    if let Some(test) = extension {
        match test {
            "woff2" => return Some(true),
            "html" => return Some(false),
            "js" => return Some(false),
            "css" => return Some(false),
            "svg" => return Some(false),
            _ => return None,
        };
    }
    None
}
