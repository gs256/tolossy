use axum::{
    Router,
    response::{Html, IntoResponse},
    routing::get,
};

const HOST: &str = "127.0.0.1:2479";

async fn index() -> impl IntoResponse {
    Html("<h1>TEST</h1>")
}

fn create_app() -> Router {
    Router::new().route("/", get(index))
}

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
