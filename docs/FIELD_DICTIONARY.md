# Field Dictionary

## teams.csv

- `team_id`: stable internal team key.
- `team_name`: Chinese display name.
- `team_name_en`: English display name.
- `fifa_code`: FIFA team code.
- `country_code`: country code used by the source database.
- `confederation`: continental confederation.
- `group_name`: 2026 World Cup group.

## group_stage_fixtures.csv

- `fixture_id`: stable fixture key.
- `match_no`: official group-stage match number.
- `stage`: tournament stage.
- `group_name`: group label.
- `kickoff_time_utc`: kickoff time in UTC.
- `venue`: venue label available in the source database.
- `city`: host city label available in the source database.
- `home_team_*` / `away_team_*`: team identifiers and display names.
- `official_source`: source label for the fixture row.

## h2h_pairs.csv

- `pair_id`: canonical unordered pair key.
- `team_low_*` / `team_high_*`: canonical pair teams.
- `direct_matches`: number of historical direct meetings.
- `competitive_matches`: direct meetings in competitive competitions.
- `friendly_matches`: direct meetings in friendlies.
- `neutral_matches`: direct meetings at neutral sites.
- `last_match_date`: most recent direct meeting date when available.
- `last_match_score`: most recent scoreline when available.
- `coverage_status`: `direct_history` or `confirmed_no_meeting`.
- `verification_status`: verification state used at export time.
- `is_group_stage_pair`: 1 when the pair is in the 2026 group-stage fixture list.
- `group_stage_match_no`: official match number when the pair is a group-stage pair.
- `model_fallback`: public-safe label from the coverage layer.
- `source_notes`: public-safe source summary, not raw internal JSON.

## h2h_matches.csv

- `match_id`: stable historical match key.
- `match_date_utc`: match date in UTC-style string.
- `competition_name`: source competition name.
- `competition_type`: broad competition type.
- `competition_stage`: stage label where available.
- `home_team_*` / `away_team_*`: team identifiers and display names.
- `home_score_ft` / `away_score_ft`: full-time score from the source.
- `result_90m`: home/draw/away result label.
- `result_final`: final result label when available.
- `venue`, `city`, `country`: location fields from the source database.
- `neutral_flag`: 1 for neutral site, 0 otherwise.
- `source`: source label.
- `source_match_id`: upstream source key or reference URL.

## h2h_summary_directed.csv

- `team_a_*` / `team_b_*`: directed matchup perspective.
- `all_matches`: total direct meetings.
- `team_a_wins` / `draws` / `team_b_wins`: result summary from Team A perspective.
- `team_a_goals` / `team_b_goals`: goals from Team A perspective.
- `competitive_matches`, `friendly_matches`, `neutral_matches`: match type splits.
- `team_a_neutral_wins` / `team_b_neutral_wins`: neutral-site wins.
- `last_match_date`, `last_match_score`: latest meeting fields.
- `last_5_form_json`, `last_10_form_json`: recent form arrays from Team A perspective.

## h2h_no_meeting_verification.csv

- `pair_id`: canonical pair key.
- `team_low_code` / `team_high_code`: FIFA codes.
- `source`: verification source.
- `source_status`: source check result.
- `evidence_url`: source page or dataset URL.
- `match_count`: number of matches found in that source for the pair.
- `checked_at`: source check timestamp.
