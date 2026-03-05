# 前后端 API 命名与使用规范（团队统一版）

> 版本：`v1.0`  
> 适用范围：本项目所有 Web 客户端、后端服务、测试脚本与文档  
> 生效日期：`2026-03-05`  
> 目标：统一前后端接口命名和调用方式，降低联调成本，减少返工

## 1. 设计原则

1. 可读：路径和字段名要“看名字就知道含义”。  
2. 一致：同类接口遵循同一模式，不出现多套风格。  
3. 可扩展：后续新增字段/筛选条件不破坏旧调用。  
4. 可测试：所有接口有明确输入、输出、错误码。  
5. 可追踪：每次请求可通过 `requestId` 定位日志。  

## 2. 全局约定（必须统一）

1. Base URL：`/api/v1`  
2. 数据格式：`application/json; charset=utf-8`  
3. 时间格式：ISO 8601，统一 UTC（示例：`2026-03-05T09:30:00Z`）  
4. 货币字段：使用“分”为单位，整型（示例：`amountInCents: 1200`）  
5. JSON 字段命名：`camelCase`（示例：`bookingId`、`startTime`）  
6. URL 命名：小写 + 复数名词 + 中划线（示例：`/pricing-rules`）  
7. 数据库命名：允许 `snake_case`，但不直接暴露给前端  

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
7. 动作接口：`POST /resources/{id}/actions`（如取消、确认）

反例与正例：

1. 反例：`POST /createBooking`  
2. 正例：`POST /bookings`

1. 反例：`POST /cancelBooking?id=xxx`  
2. 正例：`POST /bookings/{bookingId}/cancel`

## 4. 项目接口命名建议（Sprint 1 优先）

## 4.1 认证与用户

1. `POST /api/v1/auth/register`  
2. `POST /api/v1/auth/login`  
3. `GET /api/v1/users/me`

## 4.2 车辆与价格

1. `GET /api/v1/scooters`  
2. `GET /api/v1/scooters/{scooterId}`  
3. `GET /api/v1/pricing-rules`  
4. `PATCH /api/v1/pricing-rules/{ruleId}`（管理端）

## 4.3 预订与支付

1. `POST /api/v1/bookings`  
2. `GET /api/v1/bookings`（支持按用户和状态筛选）  
3. `GET /api/v1/bookings/{bookingId}`  
4. `POST /api/v1/bookings/{bookingId}/cancel`  
5. `POST /api/v1/bookings/{bookingId}/extend`  
6. `POST /api/v1/payments`

## 4.4 反馈与统计

1. `POST /api/v1/feedback`  
2. `GET /api/v1/feedback`（管理端）  
3. `PATCH /api/v1/feedback/{issueId}/priority`  
4. `GET /api/v1/reports/weekly-income`  
5. `GET /api/v1/reports/daily-income`

## 5. 查询参数统一规范

列表查询统一支持以下参数（按需实现）：

1. `page`：页码，从 `1` 开始  
2. `pageSize`：每页数量，默认 `20`，最大 `100`  
3. `sortBy`：排序字段  
4. `sortOrder`：`asc` 或 `desc`  
5. `status`：状态筛选  
6. `startDate` 与 `endDate`：时间区间筛选  

示例：

`GET /api/v1/bookings?page=1&pageSize=20&status=confirmed&sortBy=createdAt&sortOrder=desc`

## 6. 请求头与鉴权规范

1. 登录后所有受保护接口都要带：`Authorization: Bearer <token>`  
2. 所有请求建议带：`X-Request-Id: <uuid>`（前端生成或后端补齐）  
3. 幂等请求（如支付创建）建议带：`Idempotency-Key: <uuid>`  

## 7. 请求/响应结构规范

## 7.1 成功响应格式

```json
{
  "success": true,
  "code": "OK",
  "message": "Request succeeded",
  "data": {},
  "requestId": "9d1d9d95-fb23-4d79-9dd5-c12a15e8d5de",
  "timestamp": "2026-03-05T09:30:00Z"
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
  "timestamp": "2026-03-05T09:30:00Z"
}
```

## 7.3 字段约束规则

1. `id` 统一用字符串 UUID。  
2. 布尔值必须用 `true/false`，不用 `0/1`。  
3. 枚举字段固定可选值并写入文档。  
4. 不返回前端不需要的敏感字段（如 `passwordHash`）。  

## 8. HTTP 状态码约定

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

## 9. 业务错误码建议（最小集合）

1. `AUTH_INVALID_CREDENTIALS`：账号或密码错误  
2. `AUTH_TOKEN_EXPIRED`：登录态过期  
3. `SCOOTER_NOT_FOUND`：车辆不存在  
4. `SCOOTER_UNAVAILABLE`：车辆不可用  
5. `BOOKING_NOT_FOUND`：订单不存在  
6. `BOOKING_CONFLICT`：订单冲突  
7. `BOOKING_CANNOT_CANCEL`：当前状态不可取消  
8. `PAYMENT_FAILED`：支付失败  
9. `VALIDATION_ERROR`：参数校验错误

## 10. 前端调用规范（强制）

1. 禁止在页面组件中直接写 `fetch/axios`，统一走 `api client`。  
2. 目录建议：`src/api/client.ts` + `src/api/modules/*.ts`。  
3. 鉴权 token 注入、错误拦截、超时重试统一在 `client.ts` 处理。  
4. 页面层只处理“展示状态”，不处理接口细节。  
5. 所有请求都要有加载态、错误态、空数据态。

## 11. 后端实现规范（强制）

1. Controller 只做路由与参数接收，业务逻辑放 Service。  
2. 所有输入参数先做校验再入库。  
3. 所有异常统一转换为标准错误响应格式。  
4. 日志中必须记录 `requestId`、路径、耗时、状态码。  
5. 涉及并发冲突的写操作要有事务和冲突检查。

## 12. 版本管理与变更流程

1. 当前版本：`/api/v1`。  
2. 破坏性变更必须升级主版本（`v2`）。  
3. 新增可选字段不算破坏性变更。  
4. 每次接口变更必须同步更新：
   - OpenAPI 文档  
   - 对应后端代码  
   - 前端调用层  
   - 测试用例  
   - Wiki 变更记录

## 13. 联调与验收清单

1. 前后端在 Sprint 开始前确认接口清单和字段。  
2. 后端先提供 mock 或接口契约文档。  
3. 前端按契约开发，不等待后端全部完成。  
4. 联调时按模块逐个验收：auth -> scooters -> bookings -> payments。  
5. 每个接口至少覆盖成功、参数错、权限错、业务冲突四类测试。

## 14. 示例：创建预订接口（标准写法）

## 14.1 请求

`POST /api/v1/bookings`

```json
{
  "scooterId": "1f4ddf6f-e0c3-41d4-b2fb-95c8c42b9632",
  "hireType": "4h",
  "startTime": "2026-03-05T10:00:00Z"
}
```

## 14.2 成功响应

```json
{
  "success": true,
  "code": "OK",
  "message": "Booking created",
  "data": {
    "bookingId": "73b4e26d-b1e8-4101-8af9-dc9ca78aaf95",
    "status": "pendingPayment"
  },
  "requestId": "c73c7442-6197-4f3e-8d26-5e1b3ff0a7c1",
  "timestamp": "2026-03-05T09:30:00Z"
}
```

## 14.3 冲突响应

```json
{
  "success": false,
  "code": "BOOKING_CONFLICT",
  "message": "Scooter is not available",
  "errors": [
    {
      "field": "scooterId",
      "reason": "already booked in selected timeslot"
    }
  ],
  "requestId": "c73c7442-6197-4f3e-8d26-5e1b3ff0a7c1",
  "timestamp": "2026-03-05T09:30:00Z"
}
```

---

执行建议：先在组会上确认本规范，确认后把它挂到 Wiki 的 `Architecture & UML` 或 `API Contract` 页面，并按本规范逐步改造现有接口与前端调用层。

