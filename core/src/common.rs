use std::sync::{Arc, RwLock};
use tokio::{sync::watch::Sender, task::JoinHandle};

#[derive(Clone)]
pub struct AppState {
    pub shutdown_channel: Sender<bool>,
    pub task: Arc<RwLock<Option<JoinHandle<()>>>>,
}
