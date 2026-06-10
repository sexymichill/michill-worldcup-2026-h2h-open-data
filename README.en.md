# Michill World Cup 2026 H2H Open Data

[![中文](https://img.shields.io/badge/README-%E4%B8%AD%E6%96%87-lightgrey)](README.md)
[![English](https://img.shields.io/badge/README-English-blue)](README.en.md)

Hi, this is **Michill**.

I am building open football research datasets for people who want to study the 2026 World Cup with cleaner context, better source discipline, and fewer black-box assumptions. This repository is Michill's public head-to-head data package for the 2026 FIFA World Cup field. It covers every possible team-vs-team pairing among the 48 teams used by my research system.

The goal is simple: before the tournament starts, every possible matchup should already have a clear historical status:

- direct historical meetings exist;
- or the pair has been checked and confirmed as no known meeting;
- or the pair is explicitly marked as unresolved.

For this release, unresolved pairs are zero.

## What This Is

This is an open data package for football research, dashboards, notebooks, model features, and editorial analysis.

It focuses on:

- 48-team World Cup field mapping;
- 72 group-stage fixtures;
- all 1128 possible unordered team pairings;
- historical head-to-head matches;
- pair-level coverage status;
- and no-meeting verification evidence.

## What This Is Not

This is not betting advice, not a prediction model, and not a market signal feed.

It does not include Michill's private prediction-market data, model probabilities, paid-provider event data, wallet/holder analysis, creator-video intelligence, or internal trading/research logic.

## Coverage

| Metric | Value |
|---|---:|
| Teams | 48 |
| Group-stage fixtures | 72 |
| All unordered team pairs | 1128 |
| Pairs with direct historical meetings | 820 |
| Pairs confirmed as no known meeting | 308 |
| Pairs still needing verification | 0 |
| Group-stage pairs | 72 |
| Group-stage pairs with direct history | 45 |
| Group-stage pairs confirmed no meeting | 27 |
| Historical match rows | 7503 |
| Directed H2H summary rows | 2256 |

## Files

- `data/teams.csv`: the 48-team tournament field.
- `data/group_stage_fixtures.csv`: 72 group-stage fixtures.
- `data/h2h_pairs.csv`: one row for every unordered pair among the 48 teams.
- `data/h2h_matches.csv`: historical matches where both teams are in the 48-team field.
- `data/h2h_summary_directed.csv`: directed H2H summary rows for team-perspective lookup.
- `data/h2h_no_meeting_verification.csv`: source-check rows for confirmed no-meeting pairs.
- `data/h2h_coverage_matrix.json`: machine-readable pair matrix and summary.
- `checks/validation-summary.json`: generated counts and release checks.
- `checks/SHA256SUMS`: file hashes for package integrity.

## Quick Start

Use the CSV files directly in Python, R, DuckDB, SQLite, Google Sheets, or a BI tool.

Example with DuckDB:

```sql
SELECT
  coverage_status,
  COUNT(*) AS pairs
FROM read_csv_auto('data/h2h_pairs.csv')
GROUP BY coverage_status
ORDER BY pairs DESC;
```

## Example Questions

- Which World Cup teams have never played each other before?
- Which group-stage fixtures already have direct historical meetings?
- Which country pairs have the deepest historical record?
- Which future knockout matchups already have H2H context ready?
- Which pairs rely on contextual fallback rather than direct H2H?

## Status Meaning

- `direct_history`: at least one historical match exists in the included match results.
- `confirmed_no_meeting`: no match found after independent checks across the source tiers listed in `docs/SOURCES.md`.
- `needs_verification`: unresolved pair. This release should contain zero such rows.

## Michill Data Boundary

Michill uses this public package as one factual layer in a larger private research system.

The open package deliberately stops at reusable public football context. Private layers stay private:

- prediction-market snapshots;
- model outputs and edge calculations;
- paid xG or event-data provider responses;
- wallet/holder/smart-money analysis;
- creator/video intelligence;
- deployment logs and operational state.

## Caveats

- Historical results are only as complete as the attributed public sources and verification checks.
- Some source datasets record full-time scores without complete extra-time or penalty detail for older matches.
- Venue fields in older source rows may be city-level rather than stadium-level.
- FIFA, World Cup, and national-team names are used descriptively. This dataset is not affiliated with FIFA.

## About Michill

Michill is my independent football and prediction-market research project. I care about transparent data layers: what is known, what is missing, what is verified, and what should not be overclaimed.

This release is the public, reusable part of that work.

## License

See `DATA_LICENSE.md` for data terms and `LICENSE` for the export script license.
