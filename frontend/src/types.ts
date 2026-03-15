// src/types.ts

// API 基础响应结构
export interface ApiResponse<T = any> {
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
  status: 'available' | 'in_use' | 'maintenance';
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