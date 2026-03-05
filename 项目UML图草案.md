# 电动滑板车租赁系统 UML 图草案（Sprint 1 版本）

> 说明：这份文档用于 `Initial Design` 页面，强调“需求分析和结构设计”，不是最终代码实现。  
> 设计范围：优先覆盖高优先级功能（账号、预订、支付、取消、记录、管理配置、收入统计）。

## 1. 用例图（Use Case，采用 Mermaid 流程图表达）

```mermaid
flowchart LR
    C[客户 Customer]
    M[管理员/员工 Manager/Staff]
    P[支付模拟服务]
    E[邮件服务]

    subgraph SYS[电动滑板车租赁系统]
        UC1(注册/登录)
        UC2(查看车辆与价格)
        UC3(创建预订)
        UC4(模拟支付)
        UC5(查看预订记录)
        UC6(取消预订)
        UC7(配置车辆与价格)
        UC8(查看收入统计)
        UC9(反馈问题)
        UC10(处理问题优先级)
    end

    C --> UC1
    C --> UC2
    C --> UC3
    C --> UC4
    C --> UC5
    C --> UC6
    C --> UC9

    M --> UC7
    M --> UC8
    M --> UC10

    UC4 --> P
    UC3 -.可选通知.-> E
```

## 2. 领域类图（Domain Class Diagram）

```mermaid
classDiagram
    class User {
        +UUID userId
        +String email
        +String passwordHash
        +String role
        +register()
        +login()
    }

    class CustomerProfile {
        +UUID profileId
        +String fullName
        +String phone
        +String discountType
        +int weeklyHours
        +updateProfile()
        +calculateDiscountEligibility()
    }

    class Scooter {
        +UUID scooterId
        +String code
        +String status
        +String location
        +Decimal basePrice
        +updateStatus()
        +updateLocation()
    }

    class Booking {
        +UUID bookingId
        +DateTime startTime
        +DateTime endTime
        +String hireType
        +String status
        +Decimal totalCost
        +create()
        +cancel()
        +extend()
        +calculateCost()
    }

    class Payment {
        +UUID paymentId
        +UUID bookingId
        +Decimal amount
        +String method
        +String status
        +DateTime paidAt
        +simulatePay()
        +refund()
    }

    class BookingConfirmation {
        +UUID confirmationId
        +UUID bookingId
        +String channel
        +String message
        +DateTime createdAt
        +generate()
        +send()
    }

    class IssueFeedback {
        +UUID issueId
        +UUID bookingId
        +String severity
        +String description
        +String status
        +submit()
        +prioritize()
        +resolve()
    }

    class PricingRule {
        +UUID ruleId
        +String hireType
        +Decimal price
        +bool discountEnabled
        +setPrice()
        +applyDiscount()
    }

    class RevenueReport {
        +UUID reportId
        +Date weekStart
        +Decimal totalIncome
        +generateWeekly()
        +generateDailySeries()
    }

    User "1" --> "0..1" CustomerProfile : owns
    CustomerProfile "1" --> "0..*" Booking : places
    Scooter "1" --> "0..*" Booking : assigned_to
    Booking "1" --> "0..1" Payment : paid_by
    Booking "1" --> "0..1" BookingConfirmation : produces
    Booking "1" --> "0..*" IssueFeedback : has
    PricingRule "1" --> "0..*" Booking : prices
    RevenueReport ..> Booking : aggregate
```

## 3. 核心时序图（创建预订并支付）

```mermaid
sequenceDiagram
    participant U as Customer
    participant UI as Web UI
    participant API as Backend API
    participant DB as Database
    participant PAY as Payment Simulator
    participant NOTI as Notification Service

    U->>UI: 选择车辆和租赁时长
    UI->>API: POST /bookings (scooterId, hireType)
    API->>DB: 查询车辆状态
    DB-->>API: 可用
    API->>DB: 创建 booking(status=pending_payment)
    DB-->>API: bookingId
    API-->>UI: 返回待支付订单

    U->>UI: 确认支付
    UI->>API: POST /payments (bookingId)
    API->>PAY: 模拟扣款
    PAY-->>API: success
    API->>DB: 更新 payment=paid, booking=confirmed
    API->>NOTI: 发送确认消息（站内/邮件）
    NOTI-->>API: 已发送
    API-->>UI: 返回确认信息
```

## 4. 预订状态图（便于后端实现状态机）

```mermaid
stateDiagram-v2
    [*] --> PendingPayment
    PendingPayment --> Confirmed: 支付成功
    PendingPayment --> Cancelled: 用户取消/超时
    Confirmed --> Active: 到达开始时间
    Active --> Completed: 正常结束
    Active --> Extended: 申请延长
    Extended --> Active: 延长成功
    Extended --> Completed: 到期结束
    Confirmed --> Cancelled: 开始前取消
```

## 5. 与 backlog 的对应关系（Sprint 1 重点）

- `UC1 + User/CustomerProfile` 对应 ID `1`
- `UC2 + Scooter/PricingRule` 对应 ID `4`
- `UC3 + Booking` 对应 ID `5`
- `UC4 + Payment` 对应 ID `6`
- `UC5 + BookingConfirmation` 对应 ID `8`
- `UC6 + Booking.status` 对应 ID `12`
- `UC7 + PricingRule/Scooter` 对应 ID `16`
- `UC8 + RevenueReport` 对应 ID `19`

## 6. Sprint 1 的 UML 使用建议

- 先把上述图放进 Wiki 的 `Initial Design` 页面。
- 组会讨论后，只改“名称和边界”，不要一开始追求特别复杂。
- 如果实现时有变化，在 `Sprint 1 Outcomes` 里补充“设计变更说明”。

