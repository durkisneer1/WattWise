use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

#[derive(Clone, Copy, Debug)]
pub struct Coverage {
    pub fips: &'static str,
    pub name: &'static str,
    pub lat: &'static str,
    pub lon: &'static str,
    pub ref_label: &'static str,
}

pub const COVERAGE: &[Coverage] = &[
    Coverage {
        fips: "48201",
        name: "Harris County",
        lat: "29.76",
        lon: "-95.37",
        ref_label: "Houston (29.76, -95.37)",
    },
    Coverage {
        fips: "48157",
        name: "Fort Bend County",
        lat: "29.6197",
        lon: "-95.6349",
        ref_label: "Sugar Land (29.6197, -95.6349)",
    },
    Coverage {
        fips: "48339",
        name: "Montgomery County",
        lat: "30.3119",
        lon: "-95.4561",
        ref_label: "Conroe (30.3119, -95.4561)",
    },
    Coverage {
        fips: "48039",
        name: "Brazoria County",
        lat: "29.4855",
        lon: "-95.3583",
        ref_label: "Manvel (29.4855, -95.3583)",
    },
];

pub fn coverage_for(fips: &str) -> Option<&'static Coverage> {
    COVERAGE.iter().find(|c| c.fips == fips)
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum Status {
    Current,
    Stale,
    Unsupported,
    Unavailable,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Mode {
    WeatherIndex,
    Unavailable,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Source {
    pub source_id: String,
    pub name: String,
    pub url: String,
}
pub fn weather_source() -> Source {
    Source {
        source_id: "open_meteo".into(),
        name: "Open-Meteo forecast · CC BY 4.0".into(),
        url: "https://open-meteo.com/".into(),
    }
}
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Hour {
    pub time: DateTime<Utc>,
    pub gust_kmh: f64,
    pub precipitation_mm: f64,
    pub temperature_c: f64,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Features {
    pub max_gust_kmh: f64,
    pub precipitation_mm: f64,
    pub min_temperature_c: f64,
    pub max_temperature_c: f64,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DailyOutlook {
    pub date: String,
    pub max_gust_kmh: f64,
    pub precipitation_mm: f64,
    pub min_temperature_c: f64,
    pub max_temperature_c: f64,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Risk {
    pub risk_id: String,
    pub county_fips: Option<String>,
    pub county_name: Option<String>,
    pub geographic_unit: String,
    pub event_definition: Option<String>,
    pub issued_at: Option<DateTime<Utc>>,
    pub assessment_created_at: DateTime<Utc>,
    pub valid_from: Option<DateTime<Utc>>,
    pub valid_to: Option<DateTime<Utc>>,
    pub fetched_at: Option<DateTime<Utc>>,
    pub expires_at: DateTime<Utc>,
    pub mode: Mode,
    pub status: Status,
    pub probability: Option<f64>,
    pub index_value: Option<u8>,
    pub index_scale: Option<u8>,
    pub risk_band: String,
    pub display_label: String,
    pub weather_features: Option<Features>,
    pub hourly: Vec<Hour>,
    pub daily_outlook: Vec<DailyOutlook>,
    pub evidence: Vec<String>,
    pub sources: Vec<Source>,
    pub method_version: String,
    pub limitations: Vec<String>,
    pub cached: bool,
}
impl Risk {
    pub fn unavailable(now: DateTime<Utc>, coverage: Option<&Coverage>) -> Self {
        let supported = coverage.is_some();
        let ref_note = coverage
            .map(|c| {
                format!(
                    "Weather represents a disclosed reference point {}, not every location in {}.",
                    c.ref_label, c.name
                )
            })
            .unwrap_or_else(|| {
                "Select a supported Houston-area county for a weather assessment.".into()
            });
        Self {
            risk_id: uuid::Uuid::new_v4().to_string(),
            county_fips: coverage.map(|c| c.fips.into()),
            county_name: coverage.map(|c| c.name.into()),
            geographic_unit: "county".into(),
            event_definition: None,
            issued_at: None,
            assessment_created_at: now,
            valid_from: None,
            valid_to: None,
            fetched_at: None,
            expires_at: now + Duration::minutes(30),
            mode: Mode::Unavailable,
            status: if supported {
                Status::Unavailable
            } else {
                Status::Unsupported
            },
            probability: None,
            index_value: None,
            index_scale: None,
            risk_band: "unknown".into(),
            display_label: if supported {
                "Weather assessment unavailable".into()
            } else {
                "This county is outside our coverage".into()
            },
            weather_features: None,
            hourly: vec![],
            daily_outlook: vec![],
            evidence: vec![],
            sources: vec![weather_source()],
            method_version: "weather-index-v1".into(),
            limitations: vec![
                "Experimental weather index, not an outage probability or an official warning.".into(),
                ref_note,
                "The scored index uses the next 24 forecast hours only; daily_outlook is unscored context.".into(),
                "Utility conditions and non-weather outages are not included.".into(),
                "Forecast model issue time is not supplied by this endpoint; retrieval time is shown separately.".into(),
            ],
            cached: false,
        }
    }
}
fn parse_daily(data: &Value) -> Vec<DailyOutlook> {
    let Some(daily) = data.get("daily") else {
        return vec![];
    };
    let Some(dates) = daily.get("time").and_then(|v| v.as_array()) else {
        return vec![];
    };
    let mut out = vec![];
    for (i, date_v) in dates.iter().enumerate().take(7) {
        // Open-Meteo returns unix seconds when timeformat=unixtime, else ISO dates.
        let date = if let Some(ts) = date_v.as_i64() {
            let Some(dt) = DateTime::from_timestamp(ts, 0) else {
                continue;
            };
            dt.format("%Y-%m-%d").to_string()
        } else if let Some(s) = date_v.as_str() {
            s.chars().take(10).collect()
        } else {
            continue;
        };
        let Some(gust) = daily
            .get("wind_gusts_10m_max")
            .and_then(|a| a.get(i))
            .and_then(|v| v.as_f64())
        else {
            continue;
        };
        let Some(rain) = daily
            .get("precipitation_sum")
            .and_then(|a| a.get(i))
            .and_then(|v| v.as_f64())
        else {
            continue;
        };
        let Some(tmin) = daily
            .get("temperature_2m_min")
            .and_then(|a| a.get(i))
            .and_then(|v| v.as_f64())
        else {
            continue;
        };
        let Some(tmax) = daily
            .get("temperature_2m_max")
            .and_then(|a| a.get(i))
            .and_then(|v| v.as_f64())
        else {
            continue;
        };
        out.push(DailyOutlook {
            date,
            max_gust_kmh: gust,
            precipitation_mm: rain,
            min_temperature_c: tmin,
            max_temperature_c: tmax,
        });
    }
    out
}
// Returns None unless every required hourly sample exists, is finite and is physically plausible.
pub fn from_weather(data: &Value, now: DateTime<Utc>, coverage: &Coverage) -> Option<Risk> {
    let h = data.get("hourly")?;
    let times = h.get("time")?.as_array()?;
    let units = data.get("hourly_units")?;
    if units["wind_gusts_10m"] != "km/h"
        || units["precipitation"] != "mm"
        || units["temperature_2m"] != "°C"
    {
        return None;
    }
    let start = DateTime::from_timestamp((now.timestamp().div_euclid(3600) + 1) * 3600, 0)?;
    let mut hours = vec![];
    for offset in 0..24 {
        let expected = start + Duration::hours(offset);
        let index = times
            .iter()
            .position(|v| v.as_i64() == Some(expected.timestamp()))?;
        let gust = h["wind_gusts_10m"][index].as_f64()?;
        let rain = h["precipitation"][index].as_f64()?;
        let temp = h["temperature_2m"][index].as_f64()?;
        if !(0.0..=500.0).contains(&gust)
            || !(0.0..=1000.0).contains(&rain)
            || !(-100.0..=70.0).contains(&temp)
        {
            return None;
        }
        hours.push(Hour {
            time: expected,
            gust_kmh: gust,
            precipitation_mm: rain,
            temperature_c: temp,
        });
    }
    let daily = parse_daily(data);
    Some(assess(hours, daily, now, coverage))
}
pub fn assess(
    hours: Vec<Hour>,
    daily: Vec<DailyOutlook>,
    now: DateTime<Utc>,
    coverage: &Coverage,
) -> Risk {
    let f = Features {
        max_gust_kmh: hours.iter().map(|h| h.gust_kmh).fold(0.0, f64::max),
        precipitation_mm: hours.iter().map(|h| h.precipitation_mm).sum(),
        min_temperature_c: hours
            .iter()
            .map(|h| h.temperature_c)
            .fold(f64::INFINITY, f64::min),
        max_temperature_c: hours
            .iter()
            .map(|h| h.temperature_c)
            .fold(f64::NEG_INFINITY, f64::max),
    };
    let wind = if f.max_gust_kmh >= 80.0 {
        4
    } else if f.max_gust_kmh >= 60.0 {
        3
    } else if f.max_gust_kmh >= 40.0 {
        2
    } else {
        0
    };
    let rain = if f.precipitation_mm >= 75.0 {
        3
    } else if f.precipitation_mm >= 25.0 {
        2
    } else {
        0
    };
    let temperature = if f.min_temperature_c <= 0.0 || f.max_temperature_c >= 38.0 {
        2
    } else {
        0
    };
    let score = wind + rain + temperature;
    let band = if score >= 6 {
        "high"
    } else if score >= 3 {
        "elevated"
    } else {
        "lower"
    };
    let mut r = Risk::unavailable(now, Some(coverage));
    r.mode = Mode::WeatherIndex;
    r.status = Status::Current;
    r.index_value = Some(score);
    r.index_scale = Some(9);
    r.display_label = format!(
        "{} weather stress",
        if score >= 6 {
            "High"
        } else if score >= 3 {
            "Elevated"
        } else {
            "Lower"
        }
    );
    r.risk_band = band.into();
    r.valid_from = hours.first().map(|h| h.time);
    r.valid_to = r.valid_from.map(|t| t + Duration::hours(24));
    r.fetched_at = Some(now);
    r.evidence = vec![
        format!(
            "Peak gust {:.0} km/h contributes {wind} points.",
            f.max_gust_kmh
        ),
        format!(
            "Forecast precipitation {:.1} mm contributes {rain} points.",
            f.precipitation_mm
        ),
        format!(
            "Temperature range {:.0}–{:.0} °C contributes {temperature} points.",
            f.min_temperature_c, f.max_temperature_c
        ),
        format!(
            "Reference weather point: {}.",
            coverage.ref_label
        ),
    ];
    r.weather_features = Some(f);
    r.hourly = hours;
    r.daily_outlook = daily;
    r
}
pub fn rules() -> Value {
    json!({"version":"weather-index-v1","scale":9,"wind":"Peak gust: <40 km/h = 0; 40–<60 = 2; 60–<80 = 3; ≥80 = 4 points.","rain":"24-hour precipitation: <25 mm = 0; 25–<75 = 2; ≥75 = 3 points.","temperature":"Minimum ≤0 °C or maximum ≥38 °C = 2 points; otherwise 0.","bands":"0–2 lower, 3–5 elevated, 6–9 high weather stress. Project-chosen thresholds; not calibrated to outages."})
}

#[cfg(test)]
mod tests {
    use super::*;
    pub fn weather(now: DateTime<Utc>) -> Value {
        let start = (now.timestamp().div_euclid(3600) + 1) * 3600;
        json!({"hourly_units":{"wind_gusts_10m":"km/h","precipitation":"mm","temperature_2m":"°C"},"hourly":{"time":(0..24).map(|i|start+i*3600).collect::<Vec<_>>(),"wind_gusts_10m":vec![65;24],"precipitation":vec![2;24],"temperature_2m":vec![25;24]}})
    }
    fn harris() -> &'static Coverage {
        coverage_for("48201").unwrap()
    }
    #[test]
    fn supplied_weather_drives_index() {
        let now = Utc::now();
        let r = from_weather(&weather(now), now, harris()).unwrap();
        assert_eq!(r.index_value, Some(5));
        assert_eq!(r.probability, None);
        assert_eq!(r.hourly.len(), 24);
        assert_eq!(r.county_fips.as_deref(), Some("48201"));
        assert_eq!(
            r.valid_to.unwrap() - r.valid_from.unwrap(),
            Duration::hours(24)
        );
    }
    #[test]
    fn incomplete_or_wrong_units_fail_closed() {
        let now = Utc::now();
        let mut v = weather(now);
        v["hourly"]["temperature_2m"][4] = Value::Null;
        assert!(from_weather(&v, now, harris()).is_none());
        v = weather(now);
        v["hourly_units"]["wind_gusts_10m"] = json!("mph");
        assert!(from_weather(&v, now, harris()).is_none());
        v = weather(now);
        v["hourly"]["time"][5] = json!(0);
        assert!(from_weather(&v, now, harris()).is_none());
    }
    #[test]
    fn thresholds_and_missing_are_distinct() {
        let now = Utc::now();
        let mut v = weather(now);
        v["hourly"]["wind_gusts_10m"] = json!(vec![80; 24]);
        v["hourly"]["precipitation"] = json!(vec![4; 24]);
        v["hourly"]["temperature_2m"] = json!(vec![0; 24]);
        assert_eq!(from_weather(&v, now, harris()).unwrap().index_value, Some(9));
        assert_eq!(Risk::unavailable(now, Some(harris())).index_value, None);
    }
    #[test]
    fn covers_fort_bend_montgomery_brazoria() {
        assert!(coverage_for("48157").is_some());
        assert!(coverage_for("48339").is_some());
        assert!(coverage_for("48039").is_some());
        assert!(coverage_for("99999").is_none());
    }
    #[test]
    fn export_contract_fixture() {
        let now = DateTime::parse_from_rfc3339("2026-11-07T15:00:00Z")
            .unwrap()
            .with_timezone(&Utc);
        let mut r = from_weather(&weather(now), now, harris()).unwrap();
        r.risk_id = "synthetic-contract-fixture".into();
        std::fs::create_dir_all("../tests/fixtures").unwrap();
        std::fs::write(
            "../tests/fixtures/risk.json",
            serde_json::to_string_pretty(&r).unwrap(),
        )
        .unwrap();
    }
}
