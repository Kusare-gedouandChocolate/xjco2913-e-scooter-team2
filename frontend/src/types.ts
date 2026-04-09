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
  role: 'Customer' | 'Manager' | 'Staff';
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

export interface Booking {
  bookingId: string;
  scooterId: string;
  startTime: string;
  endTime: string;
  hireType: string;
  status: 'pendingPayment' | 'confirmed' | 'active' | 'extended' | 'completed' | 'cancelled';
  totalCost: number;
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
export interface Feedback {
  issueId: string;
  scooterId?: string;
  bookingId?: string;
  userId: string;
  priority: 'high' | 'low';
  severity: 'critical' | 'major' | 'minor';
  status: 'open' | 'inProgress' | 'resolved' | 'closed';
  description: string;
  createdAt: string;
}

// 统计报表模型
export interface ReportItem {
  hireType: string;
  incomeInCents: number;
}

export interface WeeklyIncomeReport {
  weekStart: string;
  weekEnd: string;
  totalIncomeInCents: number;
  items: ReportItem[];
}