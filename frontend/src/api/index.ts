// src/api/index.ts
import apiClient from './client';
import type { ApiResponse, User, Scooter, PricingRule, Booking, ScooterLocation, Feedback, WeeklyIncomeReport } from '../types';

// ==========================================
// 1. Auth 模块 (对应规范 4.1) [cite: 389-392]
// ==========================================
export interface LoginPayload {
  email: string;
  password: string;
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
  createBooking: (data: { scooterId: string; rentalOptionId: string; startTime: string }): Promise<ApiResponse<{ bookingId: string; status: string }>> => {
    return apiClient.post('/bookings', {
      scooterId: data.scooterId,
      rentalOptionId: data.rentalOptionId,
      startTime: data.startTime
    });
  },
  
  // 模拟支付
  payBooking: (data: { bookingId: string; paymentMethod?: string; simulateSuccess?: boolean }): Promise<ApiResponse<null>> => {
    return apiClient.post('/payments', {
      bookingId: data.bookingId,
      paymentMethod: data.paymentMethod || 'CREDIT_CARD',
      simulateSuccess: data.simulateSuccess !== false
    });
  },

  // 查询我的预订记录
  getMyBookings: (): Promise<ApiResponse<Booking[]>> => {
    return apiClient.get('/bookings?sortBy=startTime&sortOrder=desc');
  },

  // 取消预订
  cancelBooking: (bookingId: string): Promise<ApiResponse<null>> => {
    return apiClient.post(`/bookings/${bookingId}/cancel`);
  }
};

// ==========================================
// 4. 反馈模块 (对应 Sprint 2 Task 1)
// ==========================================
export const feedbackApi = {
  // 客户：提交反馈
  submitFeedback: (data: { description: string; severity: string; scooterId?: string }): Promise<ApiResponse<null>> => {
    return apiClient.post('/feedback', data);
  },
  // 管理端：获取反馈列表
  getAdminFeedback: (params?: { priority?: string; status?: string; page?: number }): Promise<ApiResponse<Feedback[]>> => {
    return apiClient.get('/admin/feedback', { params });
  },
  // 管理端：修改优先级
  updatePriority: (issueId: string, data: { priority: 'high' | 'low'; reason?: string }): Promise<ApiResponse<Feedback>> => {
    return apiClient.patch(`/admin/feedback/${issueId}/priority`, data);
  }
};

// ==========================================
// 5. 管理端配置模块 (对应 Sprint 2 Task 4)
// ==========================================
export const adminApi = {
  // 获取所有车辆 (包含不可用)
  getAllScooters: (): Promise<ApiResponse<Scooter[]>> => {
    return apiClient.get('/admin/scooters');
  },
  // 更新车辆状态或配置
  updateScooter: (scooterId: string, data: Partial<Scooter>): Promise<ApiResponse<Scooter>> => {
    return apiClient.patch(`/admin/scooters/${scooterId}`, data);
  },
  // 更新价格规则
  updatePricingRule: (ruleId: string, data: Partial<PricingRule>): Promise<ApiResponse<PricingRule>> => {
    return apiClient.patch(`/admin/pricing-rules/${ruleId}`, data);
  }
};

// ==========================================
// 6. 统计与地图模块 (对应 Sprint 2 Task 2 & 3)
// ==========================================
export const mapsApi = {
  // 获取车辆可用性地图点位
  getLocations: (onlyAvailable: boolean = true): Promise<ApiResponse<ScooterLocation[]>> => {
    return apiClient.get(`/scooters/locations?onlyAvailable=${onlyAvailable}`);
  }
};

export const reportsApi = {
  // 获取周收入统计
  getWeeklyIncome: (weekStart: string): Promise<ApiResponse<WeeklyIncomeReport>> => {
    return apiClient.get(`/reports/weekly-income?weekStart=${weekStart}&groupBy=hireType`);
  }
};