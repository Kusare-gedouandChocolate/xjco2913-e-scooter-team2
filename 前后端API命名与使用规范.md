# 前后端 API 命名与使用规范（团队统一版）

> 版本：`v1.2`（Sprint 3 Walk-in）  
> 适用范围：本项目所有 Web 客户端、后端服务、测试脚本与文档  
> 生效日期：`2026-04-25`  
> 目标：统一前后端接口命名和调用方式，降低联调成本，减少返工

## 0. Sprint 3 更新说明（Walk-in 路线）

本次更新用于匹配老师建议中的 `Walk-in and Rent` 路线，重点新增：

1. 到店租还流程接口（店员代录入 + 绑卡 + 到店取还）。
2. 远程下单到店取车核验流程（pickup code）。
3. 还车结算字段约束（基础费、超时费、电量差费用、损坏费用）。
4. 超时提醒与自动扣费（模拟）任务接口约束。
5. 新增角色 `clerk`（店员）权限定义。

说明：Sprint 3 不走 `Sharing Scooters` 路线，不新增扫码解锁/GPS 实时流相关专用接口。

## 1. 设计原则

1. 可读：路径和字段名要“看名字就知道含义”。
2. 一致：同类接口遵循同一模式，不出现多套风格。
3. 可扩展：后续新增字段/筛选条件不破坏旧调用。
4. 可测试：所有接口有明确输入、输出、错误码。
5. 可追踪：每次请求可通过 `requestId` 定位日志。

## 2. 全局约定（必须统一）

1. Base URL：`/api/v1`
2. 数据格式：`application/json; charset=utf-8`
3. 时间格式：ISO 8601，统一 UTC（示例：`2026-04-25T09:30:00Z`）
4. 货币字段：统一使用“分”为单位的整型（示例：`amountInCents: 1200`）
5. 电量字段：`batteryLevel` 取值范围 `0-100`，单位为百分比整数
6. 坐标字段：若涉及位置，统一 `latitude`、`longitude`（十进制度数）
7. JSON 字段命名：`camelCase`（示例：`bookingId`、`startTime`）
8. URL 命名：小写 + 复数名词 + 中划线（示例：`/pricing-rules`）
9. 数据库命名：允许 `snake_case`，但不直接暴露给前端

## 3. URL 与方法命名规则

1. 路径使用名词，不使用动词。
2. CRUD 优先使用 HTTP 方法表达语义。
3. 操作类行为使用子资源路径表达，不用模糊动词路径。

推荐模式：

1. 查询列表：`GET /resources`
2. 查询详情：`GET /resources/{id}`
3. 创建：`POST /resources`
4. 全量更新：`PUT /resources/{id}`
5. 局部更新：`PATCH /resources/{id}`
6. 删除：`DELETE /resources/{id}`
7. 动作接口：`POST /resources/{id}/actions`（如取消、确认、核验）

反例与正例：

1. 反例：`POST /createBooking`
2. 正例：`POST /bookings`
3. 反例：`POST /cancelBooking?id=xxx`
4. 正例：`POST /bookings/{bookingId}/cancel`

## 4. 项目接口命名清单（Sprint 1 + 2 + 3）

## 4.1 认证与用户

1. `POST /api/v1/auth/register`
2. `POST /api/v1/auth/login`
3. `GET /api/v1/users/me`

## 4.2 客户端：车辆、价格、预订、支付

1. `GET /api/v1/scooters`
2. `GET /api/v1/scooters/{scooterId}`
3. `GET /api/v1/scooters/locations`
4. `GET /api/v1/pricing-rules`
5. `POST /api/v1/bookings`
6. `GET /api/v1/bookings`
7. `GET /api/v1/bookings/{bookingId}`
8. `POST /api/v1/bookings/{bookingId}/cancel`
9. `POST /api/v1/payments`
10. `GET /api/v1/confirmations/{bookingId}`

## 4.3 管理端：配置、反馈、统计

1. `GET /api/v1/admin/scooters`
2. `POST /api/v1/admin/scooters`
3. `PUT /api/v1/admin/scooters/{scooterId}`
4. `DELETE /api/v1/admin/scooters/{scooterId}`
5. `PUT /api/v1/admin/pricing-rules/{ruleId}`
6. `GET /api/v1/admin/discount-rules`
7. `POST /api/v1/admin/discount-rules`
8. `PATCH /api/v1/admin/discount-rules/{ruleId}/status`
9. `GET /api/v1/admin/feedback`
10. `PATCH /api/v1/admin/feedback/{feedbackId}/priority`
11. `PATCH /api/v1/admin/feedback/{feedbackId}/status`
12. `GET /api/v1/admin/feedback/high-priority`
13. `GET /api/v1/admin/statistics/weekly-revenue`
14. `GET /api/v1/admin/statistics/daily-revenue`

## 4.4 Walk-in and Rent（Sprint 3 重点新增）

1. `POST /api/v1/walk-in/customers`（店员代录入客户）
2. `POST /api/v1/walk-in/rentals`（店员创建到店租车单）
3. `POST /api/v1/bookings/{bookingId}/pickup-verifications`（远程下单到店核验）
4. `POST /api/v1/bookings/{bookingId}/returns`（还车并写入电量快照）
5. `POST /api/v1/bookings/{bookingId}/damage-reports`（还车损坏上报）
6. `GET /api/v1/bookings/{bookingId}/settlement`（查看结算明细）
7. `POST /api/v1/admin/overdue-jobs/executions`（触发超时提醒与自动扣费模拟任务）

说明：第 4.4 节为 Sprint 3 约束清单，未完成实现前可先以 mock 或占位响应联调。

## 5. 查询参数统一规范

列表查询统一支持以下参数（按需实现）：

1. `page`：页码，从 `1` 开始
2. `pageSize`：每页数量，默认 `20`，最大 `100`
3. `sortBy`：排序字段
4. `sortOrder`：`asc` 或 `desc`
5. `status`：状态筛选
6. `startDate` 与 `endDate`：时间区间筛选

Sprint 3 扩展参数：

1. `hireMode`：`walkIn` 或 `remote`
2. `pickupStatus`：`pending`、`verified`、`expired`
3. `returnStatus`：`pending`、`returned`
4. `onlyOverdue`：是否只看超时订单（`true/false`）
5. `includeSettlement`：是否返回费用拆分（`true/false`）
6. `batteryDeltaMin`：电量差下限筛选

示例：

1. `GET /api/v1/bookings?hireMode=walkIn&status=active&page=1&pageSize=20`
2. `GET /api/v1/bookings?pickupStatus=pending&sortBy=createdAt&sortOrder=desc`
3. `GET /api/v1/admin/feedback?priority=high&status=open&page=1&pageSize=20`

## 6. 请求头与鉴权规范

1. 登录后所有受保护接口都要带：`Authorization: Bearer <token>`
2. 所有请求建议带：`X-Request-Id: <uuid>`（前端生成或后端补齐）
3. 幂等请求建议带：`Idempotency-Key: <uuid>`（支付、到店创建租单、自动扣费任务）

## 6.1 角色权限矩阵

| 接口组 | customer | clerk | manager/admin |
|---|---|---|---|
| `/auth/*` | 允许 | 允许 | 允许 |
| `/users/me` | 允许 | 允许 | 允许 |
| `/scooters*`、`/pricing-rules` | 允许 | 允许 | 允许 |
| `/bookings*`（普通查询/取消） | 允许 | 允许 | 允许 |
| `/walk-in/*` | 禁止 | 允许 | 允许 |
| `/admin/*` | 禁止 | 部分只读可选 | 允许 |
| `/payments` | 允许 | 允许（代付场景） | 允许 |

## 7. 请求/响应结构规范

## 7.1 成功响应格式

```json
{
  "success": true,
  "code": "OK",
  "message": "Request succeeded",
  "data": {},
  "requestId": "9d1d9d95-fb23-4d79-9dd5-c12a15e8d5de",
  "timestamp": "2026-04-25T09:30:00Z"
}
```

## 7.2 失败响应格式

```json
{
  "success": false,
  "code": "BOOKING_CONFLICT",
  "message": "Scooter is not available for the selected time",
  "errors": [
    {
      "field": "scooterId",
      "reason": "already booked"
    }
  ],
  "requestId": "9d1d9d95-fb23-4d79-9dd5-c12a15e8d5de",
  "timestamp": "2026-04-25T09:30:00Z"
}
```

## 7.3 字段约束规则

1. `id` 统一用字符串 UUID。
2. 布尔值必须用 `true/false`，不用 `0/1`。
3. 枚举字段固定可选值并写入文档。
4. 不返回前端不需要的敏感字段（如 `passwordHash`、完整卡号）。

## 8. 核心枚举定义（Sprint 3）

1. `booking.status`：`pendingPayment`、`pendingPickup`、`active`、`completed`、`cancelled`
2. `hireMode`：`walkIn`、`remote`
3. `pickup.status`：`pending`、`verified`、`expired`
4. `scooter.status`：`available`、`reserved`、`unavailable`、`maintenance`
5. `feedback.priority`：`high`、`low`
6. `feedback.status`：`open`、`inProgress`、`resolved`、`closed`
7. `damage.status`：`none`、`reported`、`confirmed`
8. `payment.status`：`pending`、`succeeded`、`failed`

## 9. HTTP 状态码约定

1. `200 OK`：成功查询或成功操作
2. `201 Created`：创建成功
3. `204 No Content`：删除成功且无返回体
4. `400 Bad Request`：参数错误
5. `401 Unauthorized`：未登录或 token 无效
6. `403 Forbidden`：无权限
7. `404 Not Found`：资源不存在
8. `409 Conflict`：资源冲突（如并发抢占同一车辆）
9. `422 Unprocessable Entity`：业务校验未通过
10. `500 Internal Server Error`：服务内部错误

## 10. 业务错误码建议（Sprint 3 Walk-in 扩展）

1. `AUTH_INVALID_CREDENTIALS`：账号或密码错误
2. `AUTH_TOKEN_EXPIRED`：登录态过期
3. `ADMIN_FORBIDDEN`：非管理员访问管理端接口
4. `CLERK_FORBIDDEN`：非店员访问 walk-in 店员接口
5. `SCOOTER_NOT_FOUND`：车辆不存在
6. `SCOOTER_UNAVAILABLE`：车辆不可用
7. `BOOKING_NOT_FOUND`：订单不存在
8. `BOOKING_CONFLICT`：订单冲突
9. `BOOKING_CANNOT_CANCEL`：当前状态不可取消
10. `PICKUP_CODE_INVALID`：取车核验码错误
11. `PICKUP_CODE_EXPIRED`：取车核验码过期
12. `PICKUP_ALREADY_VERIFIED`：订单已完成取车核验
13. `RETURN_BATTERY_REQUIRED`：还车必须提交归还电量
14. `SETTLEMENT_CALCULATION_FAILED`：结算计算失败
15. `OVERDUE_AUTO_CHARGE_FAILED`：超时自动扣费失败
16. `DAMAGE_REPORT_INVALID`：损坏上报信息不合法
17. `LIABILITY_CONSENT_REQUIRED`：未同意免责条款
18. `PAYMENT_FAILED`：支付失败
19. `VALIDATION_ERROR`：参数校验错误

## 11. 前端调用规范（强制）

1. 禁止在页面组件中直接写 `fetch/axios`，统一走 `api client`。
2. 目录建议：`src/api/client.ts` + `src/api/modules/*.ts`。
3. 鉴权 token 注入、错误拦截、超时重试统一在 `client.ts` 处理。
4. 页面层只处理“展示状态”，不处理接口细节。
5. 所有请求都要有加载态、错误态、空数据态。
6. 到店租还页面、远程核验页面、还车结算页面必须复用统一 API 层。

## 12. 后端实现规范（强制）

1. Controller 只做路由与参数接收，业务逻辑放 Service。
2. 所有输入参数先做校验再入库。
3. 所有异常统一转换为标准错误响应格式。
4. 日志中必须记录 `requestId`、路径、耗时、状态码。
5. 涉及并发冲突的写操作要有事务和冲突检查。
6. 计费相关接口必须输出可解释费用明细（基础费、超时费、电量差、损坏费）。
7. 管理端变更（价格、折扣、反馈优先级）必须记录操作人和更新时间。

## 13. 版本管理与变更流程

1. 当前版本：`/api/v1`。
2. Sprint 3 期间冻结 Walk-in 路由命名，禁止破坏性修改。
3. 破坏性变更必须升级主版本（`/api/v2`）。
4. 新增可选字段不算破坏性变更。
5. 每次接口变更必须同步更新以下内容：
   - OpenAPI 文档
   - 对应后端代码
   - 前端调用层
   - 测试用例
   - Wiki 变更记录

## 14. 联调与验收清单

1. 前后端在 Sprint 开始前确认接口清单和字段。
2. 后端先提供 mock 或接口契约文档。
3. 前端按契约开发，不等待后端全部完成。
4. 联调顺序建议：`auth -> scooters/pricing -> bookings -> walk-in -> payments -> admin -> reports/feedback`。
5. 每个接口至少覆盖成功、参数错、权限错、业务冲突四类测试。

## 15. Sprint 3 示例接口（Walk-in）

## 15.1 店员创建到店租车单

`POST /api/v1/walk-in/rentals`

```json
{
  "customerName": "Alex Chen",
  "customerPhone": "+447700900123",
  "cardToken": "tok_walkin_001",
  "scooterId": "0fb2c818-25aa-4cc9-872f-9f2930aaf0b1",
  "hireType": "4h",
  "batteryLevelAtCheckout": 82,
  "liabilityConsent": true
}
```

```json
{
  "success": true,
  "code": "OK",
  "message": "Walk-in rental created",
  "data": {
    "bookingId": "73b4e26d-b1e8-4101-8af9-dc9ca78aaf95",
    "hireMode": "walkIn",
    "status": "active"
  },
  "requestId": "c73c7442-6197-4f3e-8d26-5e1b3ff0a7c1",
  "timestamp": "2026-04-25T09:30:00Z"
}
```

## 15.2 远程订单到店取车核验

`POST /api/v1/bookings/{bookingId}/pickup-verifications`

```json
{
  "pickupCode": "PK-2026-00018",
  "verifiedBy": "clerk_001"
}
```

## 15.3 还车结算查询

`GET /api/v1/bookings/{bookingId}/settlement`

```json
{
  "success": true,
  "code": "OK",
  "message": "Request succeeded",
  "data": {
    "bookingId": "73b4e26d-b1e8-4101-8af9-dc9ca78aaf95",
    "batteryLevelAtCheckout": 82,
    "batteryLevelAtReturn": 46,
    "fees": {
      "baseFeeInCents": 1800,
      "overtimeFeeInCents": 300,
      "batteryDeltaFeeInCents": 240,
      "damageFeeInCents": 0,
      "totalInCents": 2340
    }
  },
  "requestId": "85f91940-aa93-47f8-88cf-3852f5f90f43",
  "timestamp": "2026-04-25T09:30:00Z"
}
```

---

执行建议：先在组会上确认本规范，再同步到 Wiki 的 `API Contract` 页面；确认后按模块推进接口实现与测试，避免 Sprint 3 后期集中返工。
