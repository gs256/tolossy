use axum::body::{self, Body};

pub async fn response_body_str(body: Body) -> String {
    let bytes = body::to_bytes(body, usize::MAX).await.unwrap();
    let text = String::from_utf8(bytes.to_vec()).unwrap();
    return text;
}
