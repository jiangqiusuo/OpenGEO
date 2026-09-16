# @opengeo/metrics

OpenGEO 公共指标计算包，依赖 `@opengeo/contracts` 的 `Observation` 与 `MetricResult` 类型。

当前实现并固定版本 `1.0.0` 的基础指标：

- `mention_rate` 提及率
- `top3_rate_absolute` 绝对 Top3 率
- `top3_rate_conditional` 条件 Top3 率
- `answer_rate`、`top1_rate`、`average_rank`、`result_completeness`

计算会先按 observation `id` 去重，再排除 `quality.is_valid=false`。品牌提及按 `entity_id` 布尔去重；排名仅接受大于等于 1 的有限数字，无排名不会当作零排名。分母为零时返回 `null`，结果包含样本计数和 evidence query。
