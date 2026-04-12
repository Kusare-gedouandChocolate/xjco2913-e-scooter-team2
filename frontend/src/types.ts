// src/types.ts

// API 基础响应结构
export interface ApiResponse<T = unknown> {
  success: boolean;
  code: string;
  message: string;
  data: T;
  requestId: string;
  timestamp: string;
  errors?: Array<{ field: string; reason: string }>;
}

// 核心业务模型
export interface User {
  userId: string;
  email: string;
  role: string;
}

export interface CustomerProfile {
  profileId: string;
  fullName: string;
  phone: string;
  discountType: string;
  weeklyHours: number;
}

export interface Scooter {
  scooterId: string;
  code: string;
  status: 'available' | 'reserved' | 'unavailable' | 'maintenance';
  location: string;
  basePrice: number;
}

export interface PricingRule {
  ruleId: string;
  hireType: string;
  price: number;
  discountEnabled: boolean;
}

export type BookingStatus = 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  bookingId: string;
  scooterId: string;
  hireType: string;
  startTime: string;
  endTime?: string;
  status: BookingStatus;
  totalCost: string;        // 后端返回的是字符串（BigDecimal 序列化为字符串）
  originalCost?: string;
  discountAmount?: string;
  appliedDiscountType?: string;
  appliedDiscountRate?: string;
}

// --- 以下为 Sprint 2 新增业务模型 ---

// 地图点位模型
export interface ScooterLocation {
  scooterId: string;
  code: string;
  status: 'available' | 'reserved' | 'unavailable' | 'maintenance';
  latitude: number;
  longitude: number;
  locationZone: string;
}

// 用户反馈模型 
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface Feedback {
  feedbackId: string;
  scooterId?: string;
  bookingId?: string;
  userId: string;
  category: 'BUG_REPORT' | 'COMPLAINT' | 'SUGGESTION' | 'OTHER';
  priority: 'HIGH' | 'LOW';
  status: 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED';
  content: string;
  createdAt: string;
}

// 统计报表模型
export interface ReportItem {
  hireType: string;
  incomeInCents: number;
}

// ==================== 收入统计 ====================
/** 按租赁类型的收入明细 */
export interface RevenueByHireTypeResponse {
  hireType: string;
  revenue: string;      // 字符串形式的金额（单位：元）
  paymentCount: number;
}

/** 周收入摘要 */
export interface WeeklyRevenueSummaryResponse {
  weekStart: string;
  weekEnd: string;
  totalRevenue: string;
  paymentCount: number;
  revenueByHireType: RevenueByHireTypeResponse[];
}

/** 周收入统计完整响应 (与 WeeklyRevenueStatisticsResponse 对齐) */
export interface WeeklyRevenueStatisticsResponse {
  startDate: string;
  endDate: string;
  totalRevenue: string;
  totalPaymentCount: number;
  empty: boolean;
  weeklyRevenue: WeeklyRevenueSummaryResponse[];
  selectedWeek: WeeklyRevenueSummaryResponse | null;
}

// ==================== 车辆管理 ====================
/** 后端 Scooter 状态枚举 */
export type ScooterStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'LOCKED';

/** 管理员创建/更新车辆的请求体 (与 AdminScooterRequest 对齐) */
export interface AdminScooterRequest {
  model: string;
  status: ScooterStatus;
  batteryLevel: number;
  currentLocation: string;
}

/** 管理员获取车辆的响应体 (与 AdminScooterResponse 对齐) */
export interface AdminScooterResponse {
  scooterId: string;
  model: string;
  status: ScooterStatus;
  batteryLevel: number;
  currentLocation: string;
  createdAt: string;
}

// ==================== 价格规则管理 ====================
/** 价格规则响应 (与 PricingRuleResponse 对齐) */
export interface PricingRuleResponse {
  ruleId: string;
  hireType: string;
  price: number;          // 注意后端返回的是 integer (单位: 分)
  discountEnabled: boolean;
}

/** 更新价格规则的请求体 (与 PricingRuleUpdateRequest 对齐) */
export interface PricingRuleUpdateRequest {
  hireType: string;
  durationHours: number;
  price: number;
}
