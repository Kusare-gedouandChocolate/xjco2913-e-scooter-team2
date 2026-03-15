// src/api/index.ts
import apiClient from './client';
import type { ApiResponse, User, Scooter, PricingRule, Booking } from '../types';

// ==========================================
// 1. Auth 模块 (对应规范 4.1) [cite: 389-392]
// ==========================================
export interface LoginPayload {
  email: string;
  passwordHash: string;
}

export interface RegisterPayload extends LoginPayload {
  fullName: string;
  phone: string;
}

export const authApi = {
  login: (data: LoginPayload): Promise<ApiResponse<{ token: string; user: User }>> => {
    return apiClient.post('/auth/login', data);
  },
  register: (data: RegisterPayload): Promise<ApiResponse<{ token: string; user: User }>> => {
    return apiClient.post('/auth/register', data);
  }
};

// ==========================================
// 2. 车辆与价格模块 (对应规范 4.2) [cite: 393-397]
// ==========================================
export const scootersApi = {
  getScooters: (): Promise<ApiResponse<Scooter[]>> => {
    return apiClient.get('/scooters');
  },
  getPricingRules: (): Promise<ApiResponse<PricingRule[]>> => {
    return apiClient.get('/pricing-rules');
  }
};

// ==========================================
// 3. 预订与支付模块 (对应规范 4.3) [cite: 398-404]
// ==========================================
export const bookingsApi = {
  // 创建预订
  createBooking: (data: { scooterId: string; hireType: string; startTime: string }): Promise<ApiResponse<{ bookingId: string; status: string }>> => {
    return apiClient.post('/bookings', data);
  },
  
  // 模拟支付
  payBooking: (data: { bookingId: string }): Promise<ApiResponse<any>> => {
    return apiClient.post('/payments', data);
  }, // <--- 之前可能就是这里漏了逗号！

  // 查询我的预订记录
  getMyBookings: (): Promise<ApiResponse<Booking[]>> => {
    return apiClient.get('/bookings?sortBy=startTime&sortOrder=desc');
  },

  // 取消预订
  cancelBooking: (bookingId: string): Promise<ApiResponse<any>> => {
    return apiClient.post(`/bookings/${bookingId}/cancel`);
  }
};