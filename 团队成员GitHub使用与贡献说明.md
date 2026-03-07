# 团队成员 GitHub 使用与贡献说明

> 适用对象：本项目全体组员  
> 目标：统一协作方式，确保每位成员都有可追踪贡献，满足 CWK1/CWK2 对 GitHub 过程证据的要求

## 1. 我们为什么必须规范使用 GitHub

本课程评分不仅看“功能是否实现”，还看“工程过程是否规范”。  
所以每位成员都必须在 GitHub 留下清晰证据，包括：

1. 你负责了哪些任务（Issues）。  
2. 你提交了哪些代码或文档（Commits/PR）。  
3. 你参与了哪些会议与决策（Wiki 会议记录）。  
4. 你如何验证质量（测试记录/CI）。  

## 2. 每位成员第一天必须完成的 8 件事

1. 接受仓库邀请，确认能访问仓库。  
2. 配置好本地 Git 用户名和邮箱。  
3. 克隆仓库到本地。  
4. 了解仓库目录结构（frontend/backend/database/docs 等）。  
5. 阅读 `README`（运行方式、分支规范、提交流程）。  
6. 打开 `Issues`，确认自己被分配了任务。  
7. 打开 `Projects` 看板，确认任务状态列。  
8. 打开 `Wiki`，了解 Sprint 页面和会议纪要位置。  

## 3. 任务领取与执行规则（Issue 是唯一任务入口）

每个任务都必须是一个 GitHub Issue，不允许“口头任务不落地”。

1. 开始开发前先确认对应 issue 编号（例如 `#12`）。  
2. 如果没有 issue，先创建 issue 再开发。  
3. issue 必须包含：任务背景、任务内容、验收标准。  
4. issue 必须设置：Assignee、Labels、Milestone。  
5. 做任务时把卡片放到看板 `In Progress`。  
6. 任务完成并合并后，关闭 issue 并移动到 `Done`。  

## 4. 分支开发规则（禁止直接改 main）

统一使用 `feature branch + PR` 流程。

1. 每个 issue 使用独立分支。  
2. 分支命名规范：`feature/<模块>-<简述>` 或 `fix/<问题>-<简述>`。  
3. 从 `main` 创建分支，开发完成后发 PR 回 `main`。  
4. 未经评审，不允许直接向 `main` push。  

分支示例：

1. `feature/backend-booking-create`  
2. `feature/frontend-login-page`  
3. `fix/payment-status-error`  

## 5. 提交（commit）规范

每次 commit 要小而清晰，说明“改了什么”。

1. 提交信息格式：`feat: ...`、`fix: ...`、`docs: ...`、`test: ...`。  
2. 一个 commit 尽量只做一件事，避免“大杂烩提交”。  
3. 代码与无关文件不要混在同一个 commit。  
4. 提交前先本地自测，确保不会明显破坏功能。  

示例：

1. `feat: add booking create API and validation`  
2. `fix: handle unavailable scooter error response`  
3. `docs: update sprint1 outcomes in wiki`  

## 6. Pull Request（PR）规范

PR 是“请求合并 + 代码评审”的入口，不是形式流程。

1. PR 标题要清晰描述改动。  
2. PR 描述必须写：改动内容、测试结果、影响范围。  
3. PR 描述里必须关联 issue：`Closes #编号`。  
4. 至少 1 人 review 后再合并。  
5. CI 失败时禁止合并，先修复再提交。  

推荐 PR 描述模板：

```md
## 改动内容
- 

## 测试结果
- [ ] 本地测试通过
- [ ] CI 通过

## 关联任务
Closes #xx
```

## 7. Wiki 贡献规则（每个人都要参与）

Wiki 不是 Documentation Owner 一个人的工作，所有人都要贡献内容。

每位成员至少要参与以下之一：

1. 补充设计文档（UML、架构、数据库设计）。  
2. 更新测试策略或测试结果。  
3. 更新 Sprint 计划/结果页面。  
4. 更新会议纪要中的行动项结果。  

必须长期维护的核心页面：

1. `Sprint 1 Plan`  
2. `Initial Design`  
3. `Sprint 1 Outcomes`  
4. `Meeting Minutes & Attendance`  

## 8. 会议与出勤记录规则

每次会议都必须在 Wiki 有记录，至少包含：

1. 会议时间与时长。  
2. 出勤与缺勤（缺勤原因）。  
3. 讨论议题。  
4. 决策结论。  
5. 行动项（任务、负责人、截止日期）。  

没有记录的会议，默认视为“没有发生”，无法作为评分证据。

## 9. 每周贡献最低要求（建议全员执行）

每位成员每周至少完成：

1. 1 个被分配的 issue 进入 `Done`。  
2. 1 次可追踪代码提交（commit/PR）。  
3. 1 次项目文档或会议记录更新。  
4. 1 次状态会参与（有出勤记录）。  

## 10. 常见错误与禁止行为

1. 直接往 `main` 推代码。  
2. 做了任务但没有 issue。  
3. 提交大量代码但 PR 不写说明。  
4. 开会后不写纪要和出勤。  
5. 把多个无关功能混在一个 PR。  
6. 只让少数人提交，其他成员没有贡献痕迹。  

## 11. 冲刺结束前（Sprint Review 前）自检清单

1. 每个已完成任务是否都有对应 issue 和 PR。  
2. PR 是否都关联了 issue 并通过 CI。  
3. 看板状态是否与真实进度一致。  
4. Wiki 是否已更新 Plan/Outcomes/Meeting。  
5. 每位成员是否有可见贡献记录。  

## 12. 组内协作建议（提高效率）

1. 每周固定一个时间做 GitHub 看板检查。  
2. 复杂任务采用双人协作（pair）并共同评审。  
3. 每次状态会先看看板，再讨论阻塞问题。  
4. 对于延期任务，必须在 issue 写明原因和新计划。  

---

本说明为团队统一执行标准。若流程需要调整，先在会议中达成一致，再统一更新本文件和 README，避免多人使用不同规则导致混乱。
