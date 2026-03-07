# XJCO2913 软件工程项目：电动滑板车租赁系统

> 本仓库用于课程 `XJCO2913 Software Engineering Project` 小组作业开发与过程管理。  
> 当前阶段：`Sprint 1 进行中（规划与基础搭建）`

## 1. 项目简介

本项目目标是开发一个基于 `B/S` 架构的电动滑板车租赁系统，覆盖客户端与管理端两个使用场景：

1. 客户端：注册登录、查看车辆与价格、创建预订、模拟支付、查看记录、取消预订。  
2. 管理端：配置车辆与价格、查看收入统计、处理反馈问题。  

项目强调“功能实现 + 工程过程证据”并重，所有开发活动都在 GitHub 中可追踪（Issues、PR、Wiki、会议记录、测试记录）。

## 2. 课程与交付目标

1. `CWK1`：完成团队自评与项目环境初始化（GitHub 仓库、Issue 管理、Wiki、Sprint 1 记录）。  
2. `CWK2`：完成最终系统、演示与反思材料（代码质量、测试、文档、团队协作过程）。  

## 3. 功能范围

## 3.1 Must Have

1. 账号注册与登录  
2. 查看租赁选项与价格  
3. 创建预订  
4. 模拟支付  
5. 预订确认与记录查看  
6. 取消预订  
7. 管理端配置车辆和价格  
8. 周收入统计

## 3.2 Should / Could Have

1. 地图展示、可用性优化、折扣策略  
2. 反馈分级处理  
3. 并发能力增强、可访问性与响应式优化

## 4. 技术路线与架构

1. 架构：`B/S`（Browser + Server）  
2. 数据层：关系型数据库（建议 PostgreSQL）  
3. 前端：Web 客户端（建议 React + TypeScript）  
4. 后端：REST API 服务（建议 NestJS / Spring Boot 等）  
5. 测试：单元测试 + 接口测试 + 基础流程测试  
6. 自动化：GitHub Actions（lint/test/build）

详细见：

- [系统架构图草案.md](./系统架构图草案.md)
- [项目UML图草案.md](./项目UML图草案.md)

## 5. API 统一规范

本项目 API 已统一约定，联调前请先阅读：

- [前后端API命名与使用规范.md](./前后端API命名与使用规范.md)

核心规则摘要：

1. Base URL：`/api/v1`  
2. URL 命名：名词复数 + 中划线，小写  
3. 字段命名：`camelCase`  
4. 响应结构：统一 `success/code/message/data/requestId/timestamp`  
5. 错误码：统一业务错误码（如 `BOOKING_CONFLICT`）

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

## 7. Wiki 最低要求

Wiki 至少应包含以下页面并持续更新：

1. `Sprint 1 Plan`  
2. `Initial Design`  
3. `Sprint 1 Outcomes`  
4. `Meeting Minutes & Attendance`  
5. `Testing Strategy`  
6. `Backlog Status`

可直接使用模板：

- [Wiki首页模板（可复制）.md](./Wiki首页模板（可复制）.md)
- [Sprint1_12条Issue清单（可复制）.md](./Sprint1_12条Issue清单（可复制）.md)

## 8. 当前仓库文档索引

1. [项目完成建议与大致规划.md](./项目完成建议与大致规划.md)  
2. [CWK1_GitHub要求说明与操作清单.md](./CWK1_GitHub要求说明与操作清单.md)  
3. [系统架构图草案.md](./系统架构图草案.md)  
4. [项目UML图草案.md](./项目UML图草案.md)  
5. [前后端API命名与使用规范.md](./前后端API命名与使用规范.md)  
6. [团队成员GitHub使用与贡献说明.md](./团队成员GitHub使用与贡献说明.md)

## 9. 团队角色

1. Scrum Master（轮值）：`待填写`  
2. Tech Lead - Frontend：`待填写`  
3. Tech Lead - Backend：`待填写`  
4. Tech Lead - Database：`待填写`  
5. Testing Owner：`待填写`  
6. Documentation Owner：`待填写`

## 10. 下一步行动（建议）

1. 在 GitHub 创建/完善 Sprint 1 Issues，并完成负责人分配。  
2. 在 Wiki 发布本 README 对应的核心页面（Plan、Design、Meetings、Outcomes）。  
3. 依据 API 规范启动前后端联调，优先打通“注册 -> 预订 -> 支付 -> 记录查询”主链路。  

---

如需调整本 README，请通过 PR 提交并说明修改原因，确保团队信息一致。
