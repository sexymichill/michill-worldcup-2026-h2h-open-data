# Methodology

## Team Pool

The dataset is built from the fixed 48-team 2026 World Cup group-stage pool used by the private project at export time.

## Pair Construction

Each unordered pair is represented once in `h2h_pairs.csv`. The canonical pair key uses the two team IDs sorted lexicographically and joined with a hyphen.

## Direct History

A pair is marked `direct_history` when the historical match table contains at least one match between the two teams.

## Confirmed No Meeting

A pair is marked `confirmed_no_meeting` only when no record was found in the local historical source and the independent reference tiers used by the project. The public verification export lists source names, statuses, match counts, and reference URLs without redistributing page bodies.

## Directed Summary

`h2h_summary_directed.csv` contains two perspective rows for each pair. This makes it easy to ask how Team A performed against Team B without reorienting the aggregate record in application code.

## Group-Stage Flags

`is_group_stage_pair=1` marks pairs that appear in the 72 official group-stage fixtures. `group_stage_match_no` stores the match number where applicable.
