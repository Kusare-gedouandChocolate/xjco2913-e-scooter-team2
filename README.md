# XJCO2913 软件工程项目：电动滑板车租赁系统

> 本仓库用于课程 `XJCO2913 Software Engineering Project` 小组作业开发与过程管理。  
> 当前阶段：`Sprint 3 进行中（已确认 Walk-in and Rent 路线）`  
> 状态说明：`Sprint 1 / Sprint 2 已完成，Sprint 4 用于最终版本封版与提交`

## 1. 项目简介

本项目目标是开发一个基于 `B/S` 架构的电动滑板车租赁系统，覆盖客户端与管理端。

当前已明确老师建议路线二选一中选择：`Walk-in and Rent`（不走 `Sharing Scooters` 路线）。

## 2. 课程与交付目标

1. `CWK1`：完成团队协作环境初始化（GitHub、Issue、Wiki、Sprint 证据）。  
2. `CWK2`：完成最终系统、演示与反思材料（代码质量、测试、文档、团队协作过程）。

## 3. 当前功能范围（按 Walk-in 路线）

## 3.1 已完成基础能力（Sprint 1 + Sprint 2）

1. 账号注册与登录  
2. 查看车辆与价格  
3. 创建/取消预订、模拟支付、预订确认  
4. 管理端车辆与价格配置  
5. 统计与反馈流程基础能力

## 3.2 Sprint 3 重点（Walk-in and Rent）

1. 到店租还流程（店员代录入 + 绑卡）  
2. 远程下单到店取车核验  
3. 还车结算（基础费 + 超时费 + 电量差 + 损坏费）  
4. 超时提醒与自动扣费（模拟）  
5. 免责条款同意约束与流程证据

## 3.3 Sprint 4 重点（最终版本）

1. 稳定性与缺陷收敛  
2. 回归测试与最终测试报告  
3. 用户手册（客户端/管理端）  
4. 演示脚本、演示数据、故障兜底方案  
5. 团队与个人反思材料整理

## 4. 技术路线与架构

1. 架构：`B/S`（Browser + Server）  
2. 前端：`React + TypeScript + Vite`  
3. 后端：`Spring Boot`  
4. 数据层：关系型数据库（项目内 SQL 初始化脚本）  
5. 测试：接口测试 + 关键 UI 流程测试 + 回归测试  
6. 自动化：GitHub Actions（lint/test/build）

详细见：

- [系统架构图草案.md](./系统架构图草案.md)
- [项目UML图草案.md](./项目UML图草案.md)

## 5. API 统一规范

联调前请先阅读最新 API 约束文档（已按 Walk-in 路线更新）：

- [前后端API命名与使用规范.md](./前后端API命名与使用规范.md)

核心规则摘要：

1. Base URL：`/api/v1`  
2. URL 命名：名词复数 + 中划线，小写  
3. 字段命名：`camelCase`  
4. 响应结构：统一 `success/code/message/data/requestId/timestamp`  
5. 角色与权限：`customer / clerk / admin`  
6. Walk-in 关键接口：到店租还、取车核验、还车结算、超时任务

## 6. GitHub 协作规范

## 6.1 任务管理

1. 所有任务必须对应 GitHub Issue。  
2. 每条 Issue 必须设置：`Assignee`、`Labels`、`Milestone`。  
3. 看板列统一：`Todo` -> `In Progress` -> `Review` -> `Done`。

## 6.2 分支与合并

1. 禁止直接向 `main` 提交。  
2. 使用 `feature/*` 或 `fix/*` 分支开发。  
3. 通过 PR 合并，PR 需关联 Issue（`Closes #xx`）。

## 6.3 提交信息建议

1. `feat: ...` 新功能  
2. `fix: ...` 缺陷修复  
3. `docs: ...` 文档更新  
4. `test: ...` 测试相关

详细见：

- [团队成员GitHub使用与贡献说明.md](./团队成员GitHub使用与贡献说明.md)
- [GitHub项目创建与使用详细指导（CWK版）.md](./GitHub项目创建与使用详细指导（CWK版）.md)

## 7. Sprint 文档索引（当前重点）

1. [Wiki_Sprint2_Plan.md](./Wiki_Sprint2_Plan.md)  
2. [Wiki_Sprint3_Sprint4_Plan.md](./Wiki_Sprint3_Sprint4_Plan.md)  
3. [Sprint2_14条Issue清单（可复制）.md](./Sprint2_14条Issue清单（可复制）.md)  
4. [Sprint3_12条Issue清单（可复制）.md](./Sprint3_12条Issue清单（可复制）.md)

## 8. 当前仓库文档索引

1. [项目完成建议与大致规划.md](./项目完成建议与大致规划.md)  
2. [CWK1_GitHub要求说明与操作清单.md](./CWK1_GitHub要求说明与操作清单.md)  
3. [前后端API命名与使用规范.md](./前后端API命名与使用规范.md)  
4. [系统架构图草案.md](./系统架构图草案.md)  
5. [项目UML图草案.md](./项目UML图草案.md)  
6. [团队成员GitHub使用与贡献说明.md](./团队成员GitHub使用与贡献说明.md)

## 9. 团队角色（当前映射）

1. Tech Lead - Frontend：`丁学治`  
2. Tech Lead - Backend：`张凌屹`  
3. Tech Lead - Merge and Run：`夏语程`  
4. Testing Owner：`毛锦阳`  
5. Documentation Owner：`龚名颂`  
6. Scrum Master：`轮值`

## 10. 下一步行动（按当前节奏）

1. 在 GitHub 创建并分配 Sprint 3 的 12 条 Issue。  
2. 按 Walk-in API 规范冻结接口字段并开始联调。  
3. 同步维护测试证据与 Wiki 记录，避免 Sprint 4 集中补文档。  
4. 提前准备 Sprint 4 封版清单（测试报告、用户手册、演示脚本）。

---

如需调整本 README，请通过 PR 提交并说明修改原因，确保团队信息一致。
