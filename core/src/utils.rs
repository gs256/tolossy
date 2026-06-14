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

pub fn infer_content_type(path: &str) -> String {
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

pub fn is_binary(path: &str) -> bool {
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
