# Michill World Cup 2026 H2H Open Data

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

| 指标 | Metric | Value |
|---|---|---:|
| 球队 | Teams | 48 |
| 小组赛赛程 | Group-stage fixtures | 72 |
| 全部无序球队 pair | All unordered team pairs | 1128 |
| 有历史直接交锋的 pair | Pairs with direct historical meetings | 820 |
| 已确认无已知交锋的 pair | Pairs confirmed as no known meeting | 308 |
| 仍待验证的 pair | Pairs still needing verification | 0 |
| 小组赛 pair | Group-stage pairs | 72 |
| 小组赛中有直接历史交锋的 pair | Group-stage pairs with direct history | 45 |
| 小组赛中已确认无交锋的 pair | Group-stage pairs confirmed no meeting | 27 |
| 历史比赛记录行 | Historical match rows | 7503 |
| 双向 H2H 汇总行 | Directed H2H summary rows | 2256 |

## 文件说明 / Files

- `data/teams.csv`: 48 支参赛球队。 / The 48-team tournament field.
- `data/group_stage_fixtures.csv`: 72 场小组赛赛程。 / 72 group-stage fixtures.
- `data/h2h_pairs.csv`: 48 支球队之间每一个无序 pair 一行。 / One row for every unordered pair among the 48 teams.
- `data/h2h_matches.csv`: 双方都属于 48 支球队范围内的历史比赛。 / Historical matches where both teams are in the 48-team field.
- `data/h2h_summary_directed.csv`: 面向单队视角查询的双向 H2H 汇总。 / Directed H2H summary rows for team-perspective lookup.
- `data/h2h_no_meeting_verification.csv`: 已确认无交锋 pair 的来源检查记录。 / Source-check rows for confirmed no-meeting pairs.
- `data/h2h_coverage_matrix.json`: 机器可读的 pair 矩阵和摘要。 / Machine-readable pair matrix and summary.
- `checks/validation-summary.json`: 生成计数与发布校验。 / Generated counts and release checks.
- `checks/SHA256SUMS`: 文件完整性哈希。 / File hashes for package integrity.

## 快速开始 / Quick Start

你可以直接在 Python、R、DuckDB、SQLite、Google Sheets 或 BI 工具里使用这些 CSV 文件。

You can use the CSV files directly in Python, R, DuckDB, SQLite, Google Sheets, or a BI tool.

DuckDB 示例 / Example with DuckDB:

```sql
SELECT
  coverage_status,
  COUNT(*) AS pairs
FROM read_csv_auto('data/h2h_pairs.csv')
GROUP BY coverage_status
ORDER BY pairs DESC;
```

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

- `direct_history`: 数据集中至少存在一场双方历史比赛。 / At least one historical match exists in the included match results.
- `confirmed_no_meeting`: 按 `docs/SOURCES.md` 里的来源层级做独立检查后，没有找到比赛记录。 / No match found after independent checks across the source tiers listed in `docs/SOURCES.md`.
- `needs_verification`: 仍待验证的 pair。本次发布理论上应为 0 行。 / Unresolved pair. This release should contain zero such rows.

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

数据使用条款见 `DATA_LICENSE.md`，导出脚本许可证见 `LICENSE`。

See `DATA_LICENSE.md` for data terms and `LICENSE` for the export script license.
