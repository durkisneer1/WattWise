# Historical data gate: not passed

Verified during implementation on November 7, 2026:

- The [ORNL 2025 catalog](https://impact.ornl.gov/en/datasets/eagle-i-power-outage-data-2025/) describes county customer-outage counts at 15-minute intervals, with county FIPS and timestamps. This is not a home-outage dataset.
- Its [dataset DOI](https://doi.org/10.13139/ornlnccs/3012826) could not be opened by web retrieval. A direct HTTP retrieval resolved to an OSTI HTML page titled “Too Many Requests (Error 429)”. No outage records were obtained or analyzed.
- [Open-Meteo Single Runs](https://open-meteo.com/en/docs/single-runs-api) documents archived model runs. No matched outage/forecast dates have been verified here.
- Ready.gov returned HTTP 403 in research retrieval. The action bank instead uses the accessible [Red Cross](https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/power-outage.html) and [CDC](https://www.cdc.gov/prepare-your-health/take-action/power-sources.html) publications.

Consequences: no trained outage model, no probability, no evaluation metrics, no claimed negative training examples. The weather index remains the operational method. A catalog description alone does not establish Harris County record completeness or permitted redistribution of the downloaded data. Recheck license, missingness conventions and quality flags for the exact release before ingestion.

## Reproducible next step

Normalize a licensed county extract to `county_fips,timestamp,customers_without_power` and run:

```sh
python3 ml/audit_data.py path/to/county.csv --county 48201
python3 -m unittest discover -s ml -v
```

The audit reports explicit zeros, missing intervals, duplicates and invalid rows; it never inserts zeros. Its probability gate always remains false. Audit output is necessary but not sufficient for training.

## Required training design (not implemented)

Inspect real records before selecting a final event threshold. A candidate is ≥1,000 customers without power at any point in the following 24h, including an ongoing outage, with issuance at 12:00 UTC daily. Treat it as county burden, not new outage onset. Build complete as-issued forecast windows using a verified model archive; never substitute realized weather without labeling the changed task. Verify exact Harris County coverage and negative-label collection completeness.

Compare a training-period base-rate predictor against logistic regression. Split chronologically, keep storm episodes together, and embargo at least 24h between train/calibration/test (longer for longer feature lookback). Fit preprocessing on training only. Reserve separate calibration and final test sets. Report counts, event counts, prevalence, precision, recall, Brier, calibration bins and uncertainty. Obtain team review of sample adequacy and calibration before changing the API to allow probabilities. No automated threshold here can certify that scientific gate.

Python owns any future training/inference. Rust's `risk.rs` owns today's deterministic index. Do not add an unvalidated sklearn artifact to the running service.
