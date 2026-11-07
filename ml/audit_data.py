"""Audit normalized county outage CSVs without converting gaps to zero.

Standard library only. Input headers: county_fips,timestamp,customers_without_power.
This is a data gate, not a training pipeline or a claim that negatives are valid.
"""
import argparse
import csv
import json
from datetime import datetime, timezone


def audit(rows, county='48201'):
    samples = []
    invalid = 0
    for row in rows:
        if row.get('county_fips') != county:
            continue
        try:
            stamp = datetime.fromisoformat(row['timestamp'].replace('Z', '+00:00'))
            if stamp.tzinfo is None:
                raise ValueError('timestamp needs timezone')
            count = float(row['customers_without_power'])
            if not count.is_integer() or count < 0:
                raise ValueError('invalid count')
            samples.append((stamp.astimezone(timezone.utc), int(count)))
        except (ValueError, KeyError, OverflowError):
            invalid += 1
    samples.sort()
    stamps = [s[0] for s in samples]
    differences = [(b-a).total_seconds() for a, b in zip(stamps, stamps[1:])]
    return {
        'county_fips': county, 'rows': len(samples), 'invalid_rows': invalid,
        'first_timestamp': stamps[0].isoformat() if stamps else None,
        'last_timestamp': stamps[-1].isoformat() if stamps else None,
        'explicit_zero_rows': sum(c == 0 for _, c in samples),
        'duplicate_timestamps': sum(d == 0 for d in differences),
        'gaps_over_15_minutes': sum(d > 900 for d in differences),
        'off_grid_intervals': sum(d % 900 != 0 for d in differences),
        'probability_gate_passed': False,
        'limitations': ['Absent rows are not zero outages.',
                        'Explicit zeros still require collection-quality verification.',
                        'As-issued forecast overlap, event labels and held-out evaluation are not verified.'],
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv_path')
    parser.add_argument('--county', default='48201')
    args = parser.parse_args()
    with open(args.csv_path, newline='') as source:
        print(json.dumps(audit(csv.DictReader(source), args.county), indent=2))
