# Michill 2026 世界杯 H2H 开源数据

[![中文](https://img.shields.io/badge/README-%E4%B8%AD%E6%96%87-blue)](README.md)
[![English](https://img.shields.io/badge/README-English-lightgrey)](README.en.md)

大家好，这里是 **Michill**。

我正在整理一套更干净、更可复用、更有来源纪律的 2026 世界杯足球研究数据。这个仓库是 Michill 对外公开的国家队历史交锋数据包，覆盖本届 48 支参赛球队之间所有可能出现的交叉对阵。

我的目标很简单：在比赛真正开始之前，把每一个潜在的球队对阵都先整理清楚：

- 有历史直接交锋；
- 或者已经查过并确认没有已知交锋；
- 或者明确标记为仍待验证。

本次发布里，仍待验证的 pair 数量为 0。

## 这是什么

这是一个面向足球研究、数据看板、Notebook、模型特征和内容分析的开源数据包。

它重点覆盖：

- 2026 世界杯 48 支球队映射；
- 72 场小组赛赛程；
- 48 支球队之间全部 1128 个无序球队 pair；
- 历史 H2H 交锋记录；
- pair 级别覆盖状态；
- 无交锋结论的来源验证证据。

## 这不是什么

这不是投注建议，不是预测模型，也不是市场信号源。

它不包含 Michill 的私有预测市场数据、模型概率、付费事件数据、钱包/持仓分析、创作者视频情报，或内部交易与研究逻辑。

## 覆盖范围

| 指标 | 数值 |
|---|---:|
| 球队 | 48 |
| 小组赛赛程 | 72 |
| 全部无序球队 pair | 1128 |
| 有历史直接交锋的 pair | 820 |
| 已确认无已知交锋的 pair | 308 |
| 仍待验证的 pair | 0 |
| 小组赛 pair | 72 |
| 小组赛中有直接历史交锋的 pair | 45 |
| 小组赛中已确认无交锋的 pair | 27 |
| 历史比赛记录行 | 7503 |
| 双向 H2H 汇总行 | 2256 |

## 文件说明

- `data/teams.csv`: 48 支参赛球队。
- `data/group_stage_fixtures.csv`: 72 场小组赛赛程。
- `data/h2h_pairs.csv`: 48 支球队之间每一个无序 pair 一行。
- `data/h2h_matches.csv`: 双方都属于 48 支球队范围内的历史比赛。
- `data/h2h_summary_directed.csv`: 面向单队视角查询的双向 H2H 汇总。
- `data/h2h_no_meeting_verification.csv`: 已确认无交锋 pair 的来源检查记录。
- `data/h2h_coverage_matrix.json`: 机器可读的 pair 矩阵和摘要。
- `checks/validation-summary.json`: 生成计数与发布校验。
- `checks/SHA256SUMS`: 文件完整性哈希。

## 快速开始

你可以直接在 Python、R、DuckDB、SQLite、Google Sheets 或 BI 工具里使用这些 CSV 文件。

DuckDB 示例：

```sql
SELECT
  coverage_status,
  COUNT(*) AS pairs
FROM read_csv_auto('data/h2h_pairs.csv')
GROUP BY coverage_status
ORDER BY pairs DESC;
```

## 这个数据包可以回答什么

- 哪些世界杯球队之间从未有过已知交锋？
- 哪些小组赛对阵已经有直接历史交锋？
- 哪些国家队 pair 的历史记录最深？
- 哪些未来淘汰赛潜在对阵已经提前准备好了 H2H 背景？
- 哪些 pair 只能依赖上下文 fallback，而不是直接 H2H？

## 状态含义

- `direct_history`: 数据集中至少存在一场双方历史比赛。
- `confirmed_no_meeting`: 按 `docs/SOURCES.md` 里的来源层级做独立检查后，没有找到比赛记录。
- `needs_verification`: 仍待验证的 pair。本次发布理论上应为 0 行。

## Michill 数据边界

Michill 会把这个公开数据包作为更大私有研究系统里的一个事实层。

开源包故意只停留在可复用的公开足球上下文，以下私有层不会开源：

- 预测市场快照；
- 模型输出与 edge 计算；
- 付费 xG 或事件数据供应商响应；
- 钱包、持仓、聪明钱分析；
- 创作者/视频情报；
- 部署日志与运行状态。

## 注意事项

- 历史赛果的完整度取决于公开来源和验证检查本身。
- 一些较老比赛可能只有常规时间比分，缺少完整加时或点球细节。
- 较老来源中的场地字段可能是城市级别，而不是具体球场级别。
- FIFA、World Cup 和国家队名称仅作描述性使用，本数据集与 FIFA 无隶属关系。

## 关于 Michill

Michill 是我的个人足球与预测市场研究项目。我关心透明的数据层：什么是已知的，什么是缺失的，什么已经验证，什么不应该被过度声称。

这次发布是其中可以公开、可以复用的部分。

## 许可证

数据使用条款见 `DATA_LICENSE.md`，导出脚本许可证见 `LICENSE`。
