pub mod common;
pub mod conversion;
pub mod server;
pub mod utils;
use crate::common::AppState;
use crate::server::{HOST, create_app};
use crate::utils::shutdown_signal;
use std::env;
use std::sync::{Arc, RwLock};
use tokio::sync::watch::{self};

fn create_app_state() -> AppState {
    AppState {
        shutdown_channel: watch::channel(false).0,
        task: Arc::new(RwLock::new(None)),
    }
}

#[tokio::main]
async fn main() {
    let is_debug = env::var("DEBUG").unwrap_or_default() == "true";
    let state = create_app_state();
    let app = create_app(state.clone());

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
        .with_graceful_shutdown(shutdown_signal(state.shutdown_channel.subscribe()))
        .await
        .expect("failed to start server");

    println!("Server shutdown")
}
