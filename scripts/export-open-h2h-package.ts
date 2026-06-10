import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

type Row = Record<string, unknown>;

type H2hPairRow = {
  pair_id: string;
  team_low_id: string;
  team_high_id: string;
  team_low_code: string;
  team_high_code: string;
  team_low_name: string;
  team_high_name: string;
  direct_matches: number;
  competitive_matches: number;
  friendly_matches: number;
  neutral_matches: number;
  last_match_date: string | null;
  last_match_score: string | null;
  coverage_status: string;
  verification_status: string;
  is_group_stage_pair: number;
  group_stage_match_no: number | null;
  model_fallback: string;
  source_notes_json: string;
};

type SourceCheck = {
  source?: string;
  status?: string;
  evidenceUrl?: string;
  matchCount?: number;
  checkedAt?: string;
};

const PACKAGE_NAME = "michill-worldcup-2026-h2h-open-data";
const PUBLIC_INTERNATIONAL_RESULTS_URL =
  "https://github.com/martj42/international_results/blob/master/results.csv";

function parseArgs(): { outDir: string; dbPath: string } {
  const outIndex = process.argv.indexOf("--out");
  const dbIndex = process.argv.indexOf("--db");
  const defaultDbCandidates = [
    process.env.WCPM_STORAGE_ROOT ? path.join(process.env.WCPM_STORAGE_ROOT, "data", "worldcup_pm_v2.sqlite") : "",
    path.join(os.homedir(), "worldcup-pm-data-full", "data", "worldcup_pm_v2.sqlite"),
    path.join(process.cwd(), "data", "worldcup_pm_v2.sqlite")
  ].filter(Boolean);
  const defaultDbPath = defaultDbCandidates.find((candidate) => fs.existsSync(candidate)) ?? defaultDbCandidates[0];
  return {
    outDir:
      outIndex >= 0
        ? path.resolve(process.cwd(), process.argv[outIndex + 1])
        : path.join(process.cwd(), "open-data", PACKAGE_NAME),
    dbPath: dbIndex >= 0 ? path.resolve(process.cwd(), process.argv[dbIndex + 1]) : defaultDbPath
  };
}

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = typeof value === "string" ? value : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function writeCsv(filePath: string, rows: Row[], columns: string[]): void {
  const lines = [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(","))
  ];
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

function writeJson(filePath: string, payload: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function sanitizeEvidenceUrl(url: string | undefined): string {
  if (!url) return "";
  if (url.startsWith("raw/international_results")) {
    return PUBLIC_INTERNATIONAL_RESULTS_URL;
  }
  return url;
}

function sourceNotes(row: H2hPairRow): string {
  if (row.coverage_status === "direct_history") {
    return "direct_history_from_matches";
  }
  if (row.coverage_status === "confirmed_no_meeting") {
    return "four_independent_sources_checked_no_record";
  }
  return row.verification_status;
}

function noMeetingSources(row: H2hPairRow): SourceCheck[] {
  const notes = parseJson<Record<string, unknown>>(row.source_notes_json, {});
  const confirmed = notes.confirmedNoMeeting as { sources?: SourceCheck[] } | undefined;
  const verification = notes.h2hVerificationAll as { sources?: SourceCheck[] } | undefined;
  return confirmed?.sources ?? verification?.sources ?? [];
}

function sha256(filePath: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function fileRows(filePath: string): number {
  const raw = fs.readFileSync(filePath, "utf8").trimEnd();
  if (!raw) return 0;
  return Math.max(0, raw.split(/\r?\n/).length - 1);
}

function bilingualCoverageTable(rows: Array<[string, string, string | number]>): string {
  return [
    "| 指标 | Metric | Value |",
    "|---|---|---:|",
    ...rows.map(([metricZh, metricEn, value]) => `| ${metricZh} | ${metricEn} | ${value} |`)
  ].join("\n");
}

function writePackageDocs(input: {
  outDir: string;
  docsDir: string;
  scriptsDir: string;
  summary: Record<string, string | number>;
}): void {
  const { outDir, docsDir, scriptsDir, summary } = input;
  const readme = `# Michill World Cup 2026 H2H Open Data

大家好，这里是 **Michill**。

我们正在整理一套更干净、更可复用、更有来源纪律的 2026 世界杯足球研究数据。这个仓库是 Michill 对外公开的国家队历史交锋数据包，覆盖本届 48 支参赛球队之间所有可能出现的交叉对阵。

我们的目标很简单：在比赛真正开始之前，把每一个潜在的球队对阵都先整理清楚：

- 有历史直接交锋；
- 或者已经查过并确认没有已知交锋；
- 或者明确标记为仍待验证。

本次发布里，仍待验证的 pair 数量为 0。

Hi, this is **Michill**.

We are building open football research datasets for people who want to study the 2026 World Cup with cleaner context, better source discipline, and fewer black-box assumptions. This repository is Michill's public head-to-head data package for the 2026 FIFA World Cup field. It covers every possible team-vs-team pairing among the 48 teams used by our research system.

For this release, every pair is either backed by direct historical meetings or verified as no known meeting.

## 这是什么 / What This Is

这是一个面向足球研究、数据看板、Notebook、模型特征和内容分析的开源数据包。

它重点覆盖：

- 2026 世界杯 48 支球队映射；
- 72 场小组赛赛程；
- 48 支球队之间全部 1128 个无序球队 pair；
- 历史 H2H 交锋记录；
- pair 级别覆盖状态；
- 无交锋结论的来源验证证据。

This is an open data package for football research, dashboards, notebooks, model features, and editorial analysis.

It focuses on the 48-team World Cup field, 72 group-stage fixtures, all 1128 possible team pairings, historical head-to-head matches, pair-level coverage status, and no-meeting verification evidence.

## 这不是什么 / What This Is Not

这不是投注建议，不是预测模型，也不是市场信号源。

它不包含 Michill 的私有预测市场数据、模型概率、付费事件数据、钱包/持仓分析、创作者视频情报，或内部交易与研究逻辑。

This is not betting advice, not a prediction model, and not a market signal feed.

It does not include Michill's private prediction-market data, model probabilities, paid-provider event data, wallet/holder analysis, creator-video intelligence, or internal trading/research logic.

## 覆盖范围 / Coverage

${bilingualCoverageTable([
    ["球队", "Teams", summary.teams],
    ["小组赛赛程", "Group-stage fixtures", summary.fixtures],
    ["全部无序球队 pair", "All unordered team pairs", summary.totalPairs],
    ["有历史直接交锋的 pair", "Pairs with direct historical meetings", summary.directHistoryPairs],
    ["已确认无已知交锋的 pair", "Pairs confirmed as no known meeting", summary.confirmedNoMeetingPairs],
    ["仍待验证的 pair", "Pairs still needing verification", summary.needsVerificationPairs],
    ["小组赛 pair", "Group-stage pairs", summary.groupStagePairs],
    ["小组赛中有直接历史交锋的 pair", "Group-stage pairs with direct history", summary.groupStageDirectHistoryPairs],
    ["小组赛中已确认无交锋的 pair", "Group-stage pairs confirmed no meeting", summary.groupStageConfirmedNoMeetingPairs],
    ["历史比赛记录行", "Historical match rows", summary.h2hMatches],
    ["双向 H2H 汇总行", "Directed H2H summary rows", summary.h2hSummaryDirectedRows]
  ])}

## 文件说明 / Files

- \`data/teams.csv\`: 48 支参赛球队。 / The 48-team tournament field.
- \`data/group_stage_fixtures.csv\`: 72 场小组赛赛程。 / 72 group-stage fixtures.
- \`data/h2h_pairs.csv\`: 48 支球队之间每一个无序 pair 一行。 / One row for every unordered pair among the 48 teams.
- \`data/h2h_matches.csv\`: 双方都属于 48 支球队范围内的历史比赛。 / Historical matches where both teams are in the 48-team field.
- \`data/h2h_summary_directed.csv\`: 面向单队视角查询的双向 H2H 汇总。 / Directed H2H summary rows for team-perspective lookup.
- \`data/h2h_no_meeting_verification.csv\`: 已确认无交锋 pair 的来源检查记录。 / Source-check rows for confirmed no-meeting pairs.
- \`data/h2h_coverage_matrix.json\`: 机器可读的 pair 矩阵和摘要。 / Machine-readable pair matrix and summary.
- \`checks/validation-summary.json\`: 生成计数与发布校验。 / Generated counts and release checks.
- \`checks/SHA256SUMS\`: 文件完整性哈希。 / File hashes for package integrity.

## 快速开始 / Quick Start

你可以直接在 Python、R、DuckDB、SQLite、Google Sheets 或 BI 工具里使用这些 CSV 文件。

You can use the CSV files directly in Python, R, DuckDB, SQLite, Google Sheets, or a BI tool.

DuckDB 示例 / Example with DuckDB:

\`\`\`sql
SELECT
  coverage_status,
  COUNT(*) AS pairs
FROM read_csv_auto('data/h2h_pairs.csv')
GROUP BY coverage_status
ORDER BY pairs DESC;
\`\`\`

这个数据包可以回答的问题包括：

- 哪些世界杯球队之间从未有过已知交锋？
- 哪些小组赛对阵已经有直接历史交锋？
- 哪些国家队 pair 的历史记录最深？
- 哪些未来淘汰赛潜在对阵已经提前准备好了 H2H 背景？
- 哪些 pair 只能依赖上下文 fallback，而不是直接 H2H？

Example questions this dataset can answer:

- Which World Cup teams have never played each other before?
- Which group-stage fixtures already have direct historical meetings?
- Which country pairs have the deepest historical record?
- Which future knockout matchups already have H2H context ready?
- Which pairs rely on contextual fallback rather than direct H2H?

## 状态含义 / Status Meaning

- \`direct_history\`: 数据集中至少存在一场双方历史比赛。 / At least one historical match exists in the included match results.
- \`confirmed_no_meeting\`: 按 \`docs/SOURCES.md\` 里的来源层级做独立检查后，没有找到比赛记录。 / No match found after independent checks across the source tiers listed in \`docs/SOURCES.md\`.
- \`needs_verification\`: 仍待验证的 pair。本次发布理论上应为 0 行。 / Unresolved pair. This release should contain zero such rows.

## Michill 数据边界 / Michill Data Boundary

Michill 会把这个公开数据包作为更大私有研究系统里的一个事实层。

开源包故意只停留在可复用的公开足球上下文，以下私有层不会开源：

- 预测市场快照；
- 模型输出与 edge 计算；
- 付费 xG 或事件数据供应商响应；
- 钱包、持仓、聪明钱分析；
- 创作者/视频情报；
- 部署日志与运行状态。

Michill uses this public package as one factual layer in a larger private research system.

The open package deliberately stops at reusable public football context. Private layers stay private: prediction-market snapshots, model outputs, paid xG/event-data provider responses, wallet/holder analysis, creator/video intelligence, deployment logs, and operational state.

## 注意事项 / Caveats

- 历史赛果的完整度取决于公开来源和验证检查本身。 / Historical results are only as complete as the attributed public sources and verification checks.
- 一些较老比赛可能只有常规时间比分，缺少完整加时或点球细节。 / Some source datasets record full-time scores without complete extra-time or penalty detail for older matches.
- 较老来源中的场地字段可能是城市级别，而不是具体球场级别。 / Venue fields in older source rows may be city-level rather than stadium-level.
- FIFA、World Cup 和国家队名称仅作描述性使用，本数据集与 FIFA 无隶属关系。 / FIFA, World Cup, and national-team names are used descriptively. This dataset is not affiliated with FIFA.

## 关于 Michill / About Michill

Michill 是一个独立的足球与预测市场研究项目。我们关心透明的数据层：什么是已知的，什么是缺失的，什么已经验证，什么不应该被过度声称。

这次发布是其中可以公开、可以复用的部分。

Michill is an independent football and prediction-market research project. We care about transparent data layers: what is known, what is missing, what is verified, and what should not be overclaimed.

This release is the public, reusable part of that work.

## 许可证 / License

数据使用条款见 \`DATA_LICENSE.md\`，导出脚本许可证见 \`LICENSE\`。

See \`DATA_LICENSE.md\` for data terms and \`LICENSE\` for the export script license.
`;
  fs.writeFileSync(path.join(outDir, "README.md"), readme, "utf8");

  const methodology = `# Methodology

## Team Pool

The dataset is built from the fixed 48-team 2026 World Cup group-stage pool used by the private project at export time.

## Pair Construction

Each unordered pair is represented once in \`h2h_pairs.csv\`. The canonical pair key uses the two team IDs sorted lexicographically and joined with a hyphen.

## Direct History

A pair is marked \`direct_history\` when the historical match table contains at least one match between the two teams.

## Confirmed No Meeting

A pair is marked \`confirmed_no_meeting\` only when no record was found in the local historical source and the independent reference tiers used by the project. The public verification export lists source names, statuses, match counts, and reference URLs without redistributing page bodies.

## Directed Summary

\`h2h_summary_directed.csv\` contains two perspective rows for each pair. This makes it easy to ask how Team A performed against Team B without reorienting the aggregate record in application code.

## Group-Stage Flags

\`is_group_stage_pair=1\` marks pairs that appear in the 72 official group-stage fixtures. \`group_stage_match_no\` stores the match number where applicable.
`;
  fs.writeFileSync(path.join(docsDir, "METHODOLOGY.md"), methodology, "utf8");

  const fieldDictionary = `# Field Dictionary

## teams.csv

- \`team_id\`: stable internal team key.
- \`team_name\`: Chinese display name.
- \`team_name_en\`: English display name.
- \`fifa_code\`: FIFA team code.
- \`country_code\`: country code used by the source database.
- \`confederation\`: continental confederation.
- \`group_name\`: 2026 World Cup group.

## group_stage_fixtures.csv

- \`fixture_id\`: stable fixture key.
- \`match_no\`: official group-stage match number.
- \`stage\`: tournament stage.
- \`group_name\`: group label.
- \`kickoff_time_utc\`: kickoff time in UTC.
- \`venue\`: venue label available in the source database.
- \`city\`: host city label available in the source database.
- \`home_team_*\` / \`away_team_*\`: team identifiers and display names.
- \`official_source\`: source label for the fixture row.

## h2h_pairs.csv

- \`pair_id\`: canonical unordered pair key.
- \`team_low_*\` / \`team_high_*\`: canonical pair teams.
- \`direct_matches\`: number of historical direct meetings.
- \`competitive_matches\`: direct meetings in competitive competitions.
- \`friendly_matches\`: direct meetings in friendlies.
- \`neutral_matches\`: direct meetings at neutral sites.
- \`last_match_date\`: most recent direct meeting date when available.
- \`last_match_score\`: most recent scoreline when available.
- \`coverage_status\`: \`direct_history\` or \`confirmed_no_meeting\`.
- \`verification_status\`: verification state used at export time.
- \`is_group_stage_pair\`: 1 when the pair is in the 2026 group-stage fixture list.
- \`group_stage_match_no\`: official match number when the pair is a group-stage pair.
- \`model_fallback\`: public-safe label from the coverage layer.
- \`source_notes\`: public-safe source summary, not raw internal JSON.

## h2h_matches.csv

- \`match_id\`: stable historical match key.
- \`match_date_utc\`: match date in UTC-style string.
- \`competition_name\`: source competition name.
- \`competition_type\`: broad competition type.
- \`competition_stage\`: stage label where available.
- \`home_team_*\` / \`away_team_*\`: team identifiers and display names.
- \`home_score_ft\` / \`away_score_ft\`: full-time score from the source.
- \`result_90m\`: home/draw/away result label.
- \`result_final\`: final result label when available.
- \`venue\`, \`city\`, \`country\`: location fields from the source database.
- \`neutral_flag\`: 1 for neutral site, 0 otherwise.
- \`source\`: source label.
- \`source_match_id\`: upstream source key or reference URL.

## h2h_summary_directed.csv

- \`team_a_*\` / \`team_b_*\`: directed matchup perspective.
- \`all_matches\`: total direct meetings.
- \`team_a_wins\` / \`draws\` / \`team_b_wins\`: result summary from Team A perspective.
- \`team_a_goals\` / \`team_b_goals\`: goals from Team A perspective.
- \`competitive_matches\`, \`friendly_matches\`, \`neutral_matches\`: match type splits.
- \`team_a_neutral_wins\` / \`team_b_neutral_wins\`: neutral-site wins.
- \`last_match_date\`, \`last_match_score\`: latest meeting fields.
- \`last_5_form_json\`, \`last_10_form_json\`: recent form arrays from Team A perspective.

## h2h_no_meeting_verification.csv

- \`pair_id\`: canonical pair key.
- \`team_low_code\` / \`team_high_code\`: FIFA codes.
- \`source\`: verification source.
- \`source_status\`: source check result.
- \`evidence_url\`: source page or dataset URL.
- \`match_count\`: number of matches found in that source for the pair.
- \`checked_at\`: source check timestamp.
`;
  fs.writeFileSync(path.join(docsDir, "FIELD_DICTIONARY.md"), fieldDictionary, "utf8");

  const sources = `# Sources

## Historical Match Results

- Primary dataset: martj42/international_results
- Repository: https://github.com/martj42/international_results
- License: CC0-1.0 as stated by the upstream repository.

## Official Group-Stage Fixtures

- Source label in this package: \`fifa_official_pdf\`
- FIFA article: https://inside.fifa.com/organisation/news/updated-world-cup-2026-match-schedule-now-available
- FIFA schedule PDF: https://digitalhub.fifa.com/asset/4b5d4417-3343-4732-9cdf-14b6662af407/FWC26-Match-Schedule_English.pdf

## No-Meeting Verification References

The project checked no-meeting pairs against independent public reference tiers and exports only source names, statuses, counts, and URLs:

- Local international results dataset.
- 11v11 team opponent records.
- WorldFootball.net team opponent records.
- National Football Teams country pages.
- eu-football.info for relevant European cross-checks where applicable.

No scraped page body text is redistributed in this package.
`;
  fs.writeFileSync(path.join(docsDir, "SOURCES.md"), sources, "utf8");

  const dataLicense = `# Data License

Recommended data license for this package: CC BY 4.0, with upstream attribution preserved.

Important upstream notes:

- Historical match rows primarily derive from martj42/international_results, whose upstream repository states CC0-1.0.
- Official fixture labels derive from public FIFA schedule materials. FIFA and World Cup names are used descriptively; this package is not affiliated with FIFA.
- No body text from 11v11, WorldFootball.net, National Football Teams, or eu-football.info is redistributed. Only verification status, counts, and reference URLs are included.

If you republish this package, keep \`docs/SOURCES.md\` with the data files.
`;
  fs.writeFileSync(path.join(outDir, "DATA_LICENSE.md"), dataLicense, "utf8");

  const gitignore = `# Local/private files
.env
.env.*
*.pem
*.key
*.sqlite
*.sqlite-*
*.db
*.db-*
*.log
*.ndjson
*.ndjson.gz
raw/
logs/
node_modules/
.DS_Store
`;
  fs.writeFileSync(path.join(outDir, ".gitignore"), gitignore, "utf8");

  const mitLicense = `MIT License

Copyright (c) 2026 Rex Chin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
  fs.writeFileSync(path.join(outDir, "LICENSE"), mitLicense, "utf8");

  const scriptNote = `# Export Script

The canonical export script lives in the source project as:

\`scripts/export-open-h2h-package.ts\`

It reads the SQLite database and writes this public package. It intentionally excludes market data, model output, paid-provider event data, wallet data, creator/video intelligence, secrets, raw payload archives, and operations documents.
`;
  fs.writeFileSync(path.join(scriptsDir, "README.md"), scriptNote, "utf8");
}

function main(): void {
  const { outDir, dbPath } = parseArgs();
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database not found: ${dbPath}`);
  }

  const dataDir = path.join(outDir, "data");
  const docsDir = path.join(outDir, "docs");
  const checksDir = path.join(outDir, "checks");
  const scriptsDir = path.join(outDir, "scripts");
  for (const dir of [outDir, dataDir, docsDir, checksDir, scriptsDir]) ensureDir(dir);

  const db = new Database(dbPath, { readonly: true });

  const teams = db.prepare(`
    SELECT team_id, team_name, team_name_en, fifa_code, country_code, confederation, group_name
    FROM teams
    WHERE is_world_cup_2026_team = 1
    ORDER BY group_name, fifa_code
  `).all() as Row[];

  const fixtures = db.prepare(`
    SELECT
      f.fixture_id, f.match_no, f.stage, f.group_name, f.kickoff_time_utc, f.venue, f.city,
      f.home_team_id, ht.fifa_code AS home_team_code, ht.team_name AS home_team_name,
      ht.team_name_en AS home_team_name_en,
      f.away_team_id, at.fifa_code AS away_team_code, at.team_name AS away_team_name,
      at.team_name_en AS away_team_name_en,
      f.official_source
    FROM world_cup_fixtures f
    JOIN teams ht ON ht.team_id = f.home_team_id
    JOIN teams at ON at.team_id = f.away_team_id
    ORDER BY f.match_no
  `).all() as Row[];

  const pairsRaw = db.prepare(`
    SELECT
      pair_id, team_low_id, team_high_id, team_low_code, team_high_code, team_low_name, team_high_name,
      direct_matches, competitive_matches, friendly_matches, neutral_matches, last_match_date, last_match_score,
      coverage_status, verification_status, is_group_stage_pair, group_stage_match_no, model_fallback,
      source_notes_json
    FROM h2h_pair_coverage
    ORDER BY pair_id
  `).all() as H2hPairRow[];

  const pairs = pairsRaw.map((row) => ({
    pair_id: row.pair_id,
    team_low_id: row.team_low_id,
    team_high_id: row.team_high_id,
    team_low_code: row.team_low_code,
    team_high_code: row.team_high_code,
    team_low_name: row.team_low_name,
    team_high_name: row.team_high_name,
    direct_matches: row.direct_matches,
    competitive_matches: row.competitive_matches,
    friendly_matches: row.friendly_matches,
    neutral_matches: row.neutral_matches,
    last_match_date: row.last_match_date,
    last_match_score: row.last_match_score,
    coverage_status: row.coverage_status,
    verification_status: row.verification_status,
    is_group_stage_pair: row.is_group_stage_pair,
    group_stage_match_no: row.group_stage_match_no,
    model_fallback: row.model_fallback,
    source_notes: sourceNotes(row)
  })) as Row[];

  const noMeetingVerification = pairsRaw
    .filter((row) => row.coverage_status === "confirmed_no_meeting")
    .flatMap((row) =>
      noMeetingSources(row).map((source) => ({
        pair_id: row.pair_id,
        team_low_code: row.team_low_code,
        team_high_code: row.team_high_code,
        team_low_name: row.team_low_name,
        team_high_name: row.team_high_name,
        verification_status: row.verification_status,
        source: source.source ?? "",
        source_status: source.status ?? "",
        evidence_url: sanitizeEvidenceUrl(source.evidenceUrl),
        match_count: source.matchCount ?? 0,
        checked_at: source.checkedAt ?? ""
      }))
    ) as Row[];

  const matches = db.prepare(`
    SELECT
      m.match_id, m.match_date_utc, m.competition_name, m.competition_type, m.competition_stage,
      m.home_team_id, ht.fifa_code AS home_team_code, ht.team_name AS home_team_name,
      ht.team_name_en AS home_team_name_en,
      m.away_team_id, at.fifa_code AS away_team_code, at.team_name AS away_team_name,
      at.team_name_en AS away_team_name_en,
      m.home_score_ft, m.away_score_ft, m.result_90m, m.result_final,
      m.venue, m.city, m.country, m.neutral_flag, m.source, m.source_match_id
    FROM matches m
    JOIN teams ht ON ht.team_id = m.home_team_id
    JOIN teams at ON at.team_id = m.away_team_id
    ORDER BY m.match_date_utc, m.match_id
  `).all() as Row[];

  const summaryDirected = db.prepare(`
    SELECT
      h.team_a_id, ta.fifa_code AS team_a_code, ta.team_name AS team_a_name,
      ta.team_name_en AS team_a_name_en,
      h.team_b_id, tb.fifa_code AS team_b_code, tb.team_name AS team_b_name,
      tb.team_name_en AS team_b_name_en,
      h.all_matches, h.team_a_wins, h.draws, h.team_b_wins,
      h.team_a_goals, h.team_b_goals, h.competitive_matches, h.friendly_matches,
      h.neutral_matches, h.team_a_neutral_wins, h.team_b_neutral_wins,
      h.last_match_date, h.last_match_score, h.last_5_form_json, h.last_10_form_json
    FROM head_to_head_summary h
    JOIN teams ta ON ta.team_id = h.team_a_id
    JOIN teams tb ON tb.team_id = h.team_b_id
    ORDER BY h.team_a_id, h.team_b_id
  `).all() as Row[];

  const summary = {
    generatedAt: new Date().toISOString(),
    packageName: PACKAGE_NAME,
    sourceDatabase: path.basename(dbPath),
    teams: teams.length,
    fixtures: fixtures.length,
    totalPairs: pairs.length,
    directHistoryPairs: pairs.filter((row) => row.coverage_status === "direct_history").length,
    confirmedNoMeetingPairs: pairs.filter((row) => row.coverage_status === "confirmed_no_meeting").length,
    needsVerificationPairs: pairs.filter((row) => row.coverage_status === "needs_verification").length,
    groupStagePairs: pairs.filter((row) => row.is_group_stage_pair === 1).length,
    groupStageDirectHistoryPairs: pairs.filter(
      (row) => row.is_group_stage_pair === 1 && row.coverage_status === "direct_history"
    ).length,
    groupStageConfirmedNoMeetingPairs: pairs.filter(
      (row) => row.is_group_stage_pair === 1 && row.coverage_status === "confirmed_no_meeting"
    ).length,
    h2hMatches: matches.length,
    h2hSummaryDirectedRows: summaryDirected.length,
    noMeetingVerificationRows: noMeetingVerification.length
  };

  writeCsv(path.join(dataDir, "teams.csv"), teams, [
    "team_id", "team_name", "team_name_en", "fifa_code", "country_code", "confederation", "group_name"
  ]);
  writeCsv(path.join(dataDir, "group_stage_fixtures.csv"), fixtures, [
    "fixture_id", "match_no", "stage", "group_name", "kickoff_time_utc", "venue", "city",
    "home_team_id", "home_team_code", "home_team_name", "home_team_name_en",
    "away_team_id", "away_team_code", "away_team_name", "away_team_name_en", "official_source"
  ]);
  writeCsv(path.join(dataDir, "h2h_pairs.csv"), pairs, [
    "pair_id", "team_low_id", "team_high_id", "team_low_code", "team_high_code",
    "team_low_name", "team_high_name", "direct_matches", "competitive_matches", "friendly_matches",
    "neutral_matches", "last_match_date", "last_match_score", "coverage_status", "verification_status",
    "is_group_stage_pair", "group_stage_match_no", "model_fallback", "source_notes"
  ]);
  writeCsv(path.join(dataDir, "h2h_no_meeting_verification.csv"), noMeetingVerification, [
    "pair_id", "team_low_code", "team_high_code", "team_low_name", "team_high_name", "verification_status",
    "source", "source_status", "evidence_url", "match_count", "checked_at"
  ]);
  writeCsv(path.join(dataDir, "h2h_matches.csv"), matches, [
    "match_id", "match_date_utc", "competition_name", "competition_type", "competition_stage",
    "home_team_id", "home_team_code", "home_team_name", "home_team_name_en",
    "away_team_id", "away_team_code", "away_team_name", "away_team_name_en",
    "home_score_ft", "away_score_ft", "result_90m", "result_final", "venue", "city", "country",
    "neutral_flag", "source", "source_match_id"
  ]);
  writeCsv(path.join(dataDir, "h2h_summary_directed.csv"), summaryDirected, [
    "team_a_id", "team_a_code", "team_a_name", "team_a_name_en",
    "team_b_id", "team_b_code", "team_b_name", "team_b_name_en",
    "all_matches", "team_a_wins", "draws", "team_b_wins", "team_a_goals", "team_b_goals",
    "competitive_matches", "friendly_matches", "neutral_matches", "team_a_neutral_wins",
    "team_b_neutral_wins", "last_match_date", "last_match_score", "last_5_form_json", "last_10_form_json"
  ]);
  writeJson(path.join(dataDir, "h2h_coverage_matrix.json"), { summary, pairs });

  writePackageDocs({ outDir, docsDir, scriptsDir, summary });

  const validation = {
    ...summary,
    checks: {
      teams48: summary.teams === 48,
      fixtures72: summary.fixtures === 72,
      pairs1128: summary.totalPairs === 1128,
      h2hClosed: summary.directHistoryPairs + summary.confirmedNoMeetingPairs === summary.totalPairs,
      needsVerificationZero: summary.needsVerificationPairs === 0,
      groupStagePairs72: summary.groupStagePairs === 72,
      noMeetingVerificationRowsExpected: summary.noMeetingVerificationRows >= summary.confirmedNoMeetingPairs * 4
    },
    generatedFiles: {
      "data/teams.csv": fileRows(path.join(dataDir, "teams.csv")),
      "data/group_stage_fixtures.csv": fileRows(path.join(dataDir, "group_stage_fixtures.csv")),
      "data/h2h_pairs.csv": fileRows(path.join(dataDir, "h2h_pairs.csv")),
      "data/h2h_matches.csv": fileRows(path.join(dataDir, "h2h_matches.csv")),
      "data/h2h_summary_directed.csv": fileRows(path.join(dataDir, "h2h_summary_directed.csv")),
      "data/h2h_no_meeting_verification.csv": fileRows(path.join(dataDir, "h2h_no_meeting_verification.csv"))
    }
  };
  writeJson(path.join(checksDir, "validation-summary.json"), validation);

  fs.copyFileSync(
    path.join(process.cwd(), "scripts", "export-open-h2h-package.ts"),
    path.join(scriptsDir, "export-open-h2h-package.ts")
  );

  const packageFiles = [
    "README.md",
    ".gitignore",
    "LICENSE",
    "DATA_LICENSE.md",
    "data/teams.csv",
    "data/group_stage_fixtures.csv",
    "data/h2h_pairs.csv",
    "data/h2h_matches.csv",
    "data/h2h_summary_directed.csv",
    "data/h2h_no_meeting_verification.csv",
    "data/h2h_coverage_matrix.json",
    "docs/METHODOLOGY.md",
    "docs/FIELD_DICTIONARY.md",
    "docs/SOURCES.md",
    "scripts/README.md",
    "scripts/export-open-h2h-package.ts",
    "checks/validation-summary.json"
  ];
  const manifest = packageFiles.map((relativePath) => {
    const absolutePath = path.join(outDir, relativePath);
    const stat = fs.statSync(absolutePath);
    return { path: relativePath, bytes: stat.size, sha256: sha256(absolutePath) };
  });
  writeJson(path.join(checksDir, "file-manifest.json"), manifest);
  fs.writeFileSync(
    path.join(checksDir, "SHA256SUMS"),
    `${manifest.map((file) => `${file.sha256}  ${file.path}`).join("\n")}\n`,
    "utf8"
  );

  console.log(JSON.stringify({ ok: Object.values(validation.checks).every(Boolean), outDir, validation }, null, 2));
}

main();
