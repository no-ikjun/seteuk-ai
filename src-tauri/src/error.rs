use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub(crate) struct AppError {
    pub(crate) kind: &'static str,
    pub(crate) message: String,
    pub(crate) retryable: bool,
    pub(crate) attempts: u32,
    pub(crate) request_id: Option<String>,
}

impl AppError {
    pub(crate) fn new(kind: &'static str, message: impl Into<String>, retryable: bool) -> Self {
        Self {
            kind,
            message: message.into(),
            retryable,
            attempts: 1,
            request_id: None,
        }
    }

    pub(crate) fn with_context(mut self, attempts: u32, request_id: Option<String>) -> Self {
        self.attempts = attempts.max(1);
        self.request_id = request_id;
        self
    }
}

impl Display for AppError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(&self.message)
    }
}

impl std::error::Error for AppError {}

pub(crate) type AppResult<T> = Result<T, AppError>;
