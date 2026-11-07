mod plan;
mod risk;
use axum::{
    Json, Router,
    extract::Request,
    extract::{DefaultBodyLimit, Query, State},
    http::{HeaderValue, Method, StatusCode},
    middleware::{self, Next},
    response::Response,
    routing::{get, post},
};
use chrono::{Duration, Utc};
use risk::{Risk, Status};
use serde::Deserialize;
use serde_json::{Value, json};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::{Mutex, Semaphore};
use tower_http::{
    cors::CorsLayer,
    services::{ServeDir, ServeFile},
};
#[derive(Clone)]
struct AppState {
    client: reqwest::Client,
    weather: Arc<Mutex<WeatherCache>>,
    assessments: Arc<Mutex<HashMap<String, Risk>>>,
    ai_slots: Arc<Semaphore>,
    ai: Option<(String, String)>,
}
#[derive(Default)]
struct CountyWeather {
    latest: Option<Risk>,
    last_attempt: Option<chrono::DateTime<Utc>>,
}
#[derive(Default)]
struct WeatherCache {
    by_county: HashMap<String, CountyWeather>,
}
type ApiError = (StatusCode, Json<Value>);
fn error(status: StatusCode, message: &str) -> ApiError {
    (status, Json(json!({"error":message})))
}
impl AppState {
    fn new() -> Self {
        let ai = std::env::var("OPENAI_API_KEY")
            .ok()
            .filter(|v| !v.is_empty())
            .zip(std::env::var("OPENAI_MODEL").ok().filter(|v| !v.is_empty()));
        Self {
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(12))
                .build()
                .unwrap(),
            weather: Arc::new(Mutex::new(WeatherCache::default())),
            assessments: Arc::new(Mutex::new(HashMap::new())),
            ai_slots: Arc::new(Semaphore::new(2)),
            ai,
        }
    }
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RiskQuery {
    county_fips: String,
}
async fn get_risk(
    State(state): State<AppState>,
    Query(q): Query<RiskQuery>,
) -> Result<Json<Risk>, ApiError> {
    if q.county_fips.len() != 5 || !q.county_fips.bytes().all(|b| b.is_ascii_digit()) {
        return Err(error(
            StatusCode::BAD_REQUEST,
            "Use a five-digit county FIPS code.",
        ));
    }
    let now = Utc::now();
    let Some(coverage) = risk::coverage_for(&q.county_fips) else {
        return Ok(Json(Risk::unavailable(now, None)));
    };
    // Serialize refreshes so concurrent residents share one upstream request per county.
    let mut cache = state.weather.lock().await;
    let entry = cache.by_county.entry(q.county_fips.clone()).or_default();
    let recent = entry
        .last_attempt
        .is_some_and(|t| now - t < Duration::seconds(60));
    let fresh = entry
        .latest
        .as_ref()
        .is_some_and(|r| now - r.fetched_at.unwrap() < Duration::minutes(10));
    let mut result = if fresh || recent {
        entry
            .latest
            .clone()
            .unwrap_or_else(|| Risk::unavailable(now, Some(coverage)))
    } else {
        entry.last_attempt = Some(now);
        let response = state
            .client
            .get("https://api.open-meteo.com/v1/forecast")
            .query(&[
                ("latitude", coverage.lat),
                ("longitude", coverage.lon),
                ("hourly", "temperature_2m,precipitation,wind_gusts_10m"),
                (
                    "daily",
                    "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max",
                ),
                ("forecast_days", "7"),
                ("timezone", "UTC"),
                ("timeformat", "unixtime"),
                ("wind_speed_unit", "kmh"),
                ("temperature_unit", "celsius"),
                ("precipitation_unit", "mm"),
            ])
            .send()
            .await;
        let data = match response {
            Ok(r) if r.status().is_success() => r.json::<Value>().await.ok(),
            _ => None,
        };
        match data.and_then(|v| risk::from_weather(&v, Utc::now(), coverage)) {
            Some(r) => {
                entry.latest = Some(r.clone());
                r
            }
            None => {
                tracing::warn!("Weather refresh unavailable for {}", coverage.fips);
                entry
                    .latest
                    .clone()
                    .unwrap_or_else(|| Risk::unavailable(now, Some(coverage)))
            }
        }
    };
    if let Some(fetched) = result.fetched_at {
        result.cached = now - fetched > Duration::seconds(1);
        if now - fetched >= Duration::minutes(30) {
            result.status = Status::Stale;
            result.display_label = "Stale weather assessment — refresh needed".into();
        }
    }
    drop(cache);
    let mut records = state.assessments.lock().await;
    records.retain(|_, r| r.expires_at > now);
    if result.expires_at > now {
        records.insert(result.risk_id.clone(), result.clone());
    }
    Ok(Json(result))
}
async fn get_plan(
    State(state): State<AppState>,
    Json(req): Json<plan::PlanRequest>,
) -> Result<Json<plan::Plan>, ApiError> {
    req.validate()
        .map_err(|m| error(StatusCode::BAD_REQUEST, m))?;
    let risk = state
        .assessments
        .lock()
        .await
        .get(&req.risk_id)
        .filter(|r| r.expires_at > Utc::now())
        .cloned()
        .ok_or_else(|| {
            error(
                StatusCode::CONFLICT,
                "Assessment expired or unknown. Refresh the area assessment.",
            )
        })?;
    let mut result = plan::build(&risk, &req);
    if req.use_ai {
        if let Some((key, model)) = &state.ai {
            if let Ok(_permit) = state.ai_slots.clone().try_acquire_owned() {
                if let Some(actions) =
                    plan::ai_select(&state.client, key, model, &risk, &result.actions).await
                {
                    result.actions = actions;
                    result.explanation_mode = "ai_selected_approved_text".into();
                }
            }
        }
    }
    Ok(Json(result))
}
async fn health(State(state): State<AppState>) -> Json<Value> {
    let cache = state.weather.lock().await;
    let weather = if cache.by_county.values().any(|c| {
        c.latest
            .as_ref()
            .is_some_and(|r| r.expires_at > Utc::now())
    }) {
        "recent_fetch_available"
    } else {
        "not_verified"
    };
    Json(
        json!({"status":"ok","weather":weather,"ai":if state.ai.is_some(){"configured_not_verified"}else{"not_configured"},"model":"weather_index_only","counties":risk::COVERAGE.iter().map(|c|c.fips).collect::<Vec<_>>()}),
    )
}
async fn no_store(request: Request, next: Next) -> Response {
    let mut r = next.run(request).await;
    r.headers_mut()
        .insert("cache-control", HeaderValue::from_static("no-store"));
    r
}
fn app(state: AppState) -> Router {
    let origin = std::env::var("FRONTEND_ORIGIN")
        .unwrap_or_else(|_| "http://127.0.0.1:5173".into())
        .parse::<HeaderValue>()
        .expect("valid FRONTEND_ORIGIN");
    Router::new()
        .route("/health", get(health))
        .route("/api/risk", get(get_risk))
        .route("/api/plan", post(get_plan))
        .route("/api/method", get(|| async { Json(risk::rules()) }))
        .route("/api/actions", get(|| async { Json(plan::bank()) }))
        .layer(DefaultBodyLimit::max(8192))
        .layer(middleware::from_fn(no_store))
        .layer(
            CorsLayer::new()
                .allow_origin(origin)
                .allow_methods([Method::GET, Method::POST])
                .allow_headers([axum::http::header::CONTENT_TYPE]),
        )
        .fallback_service(
            ServeDir::new("frontend/dist")
                .not_found_service(ServeFile::new("frontend/dist/index.html")),
        )
        .with_state(state)
}
#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".into());
    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{port}"))
        .await
        .expect("bind local server");
    tracing::info!("WattWise http://127.0.0.1:{port}");
    axum::serve(listener, app(AppState::new())).await.unwrap();
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{body::Body, http::Request};
    use http_body_util::BodyExt;
    use tower::ServiceExt;
    #[tokio::test]
    async fn unavailable_weather_still_produces_general_plan() {
        let mut state = AppState::new();
        state.ai = None;
        state.weather.lock().await.by_county.insert(
            "48201".into(),
            CountyWeather {
                latest: None,
                last_attempt: Some(Utc::now()),
            },
        );
        let router = app(state);
        let response = router
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/api/risk?county_fips=48201")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let bytes = response.into_body().collect().await.unwrap().to_bytes();
        let risk: Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(risk["status"], "unavailable");
        assert!(risk["probability"].is_null());
        assert!(risk["index_value"].is_null());
        let response = router
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/plan")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        json!({"risk_id":risk["risk_id"], "use_ai":true}).to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(response.headers()["cache-control"], "no-store");
        let bytes = response.into_body().collect().await.unwrap().to_bytes();
        let plan: Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(plan["actions"].as_array().unwrap().len(), 3);
        assert_eq!(plan["explanation_mode"], "approved_text_fallback");
    }
    #[tokio::test]
    async fn stale_weather_is_not_current() {
        let state = AppState::new();
        let old = Utc::now() - Duration::minutes(31);
        let coverage = risk::coverage_for("48201").unwrap();
        let mut risk = Risk::unavailable(old, Some(coverage));
        risk.fetched_at = Some(old);
        risk.status = Status::Current;
        {
            let mut cache = state.weather.lock().await;
            cache.by_county.insert(
                "48201".into(),
                CountyWeather {
                    latest: Some(risk),
                    last_attempt: Some(Utc::now()),
                },
            );
        }
        let response = app(state)
            .oneshot(
                Request::builder()
                    .uri("/api/risk?county_fips=48201")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let bytes = response.into_body().collect().await.unwrap().to_bytes();
        let risk: Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(risk["status"], "stale");
    }
    #[tokio::test]
    async fn unsupported_and_invalid_counties() {
        for (query, status) in [("99999", 200), ("abc", 400)] {
            let r = app(AppState::new())
                .oneshot(
                    Request::builder()
                        .uri(format!("/api/risk?county_fips={query}"))
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap();
            assert_eq!(r.status().as_u16(), status);
            if status == 200 {
                let b = r.into_body().collect().await.unwrap().to_bytes();
                let v: Value = serde_json::from_slice(&b).unwrap();
                assert_eq!(v["status"], "unsupported");
                assert!(v["index_value"].is_null());
            }
        }
    }
    #[tokio::test]
    async fn unknown_risk_rejected() {
        let r = app(AppState::new())
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/plan")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"risk_id":"unknown"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(r.status(), StatusCode::CONFLICT);
    }
    #[tokio::test]
    async fn expired_risk_rejected() {
        let s = AppState::new();
        let r = Risk::unavailable(
            Utc::now() - Duration::hours(1),
            risk::coverage_for("48201"),
        );
        let id = r.risk_id.clone();
        s.assessments.lock().await.insert(id.clone(), r);
        let response = app(s)
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/plan")
                    .header("content-type", "application/json")
                    .body(Body::from(json!({"risk_id":id}).to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::CONFLICT);
    }
}
