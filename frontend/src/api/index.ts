// src/api/index.ts
import apiClient from './client';
import type {
  ApiResponse,
  Scooter,
  PricingRule,
  AdminScooterRequest,
  AdminScooterResponse,
  PricingRuleUpdateRequest,
  PricingRuleResponse, ScooterLocation, Feedback, Booking, User, WeeklyRevenueStatisticsResponse, PageResponse,
} from '../types';

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
  createBooking: (data: { scooterId: number; rentalOptionId: number; startTime: string }): Promise<ApiResponse<{ bookingId: string; status: string }>> => {
    return apiClient.post('/bookings', data);
  },
  
  // 模拟支付
  payBooking: (data: { bookingId: number; paymentMethod?: string }): Promise<ApiResponse<null>> => {
    return apiClient.post('/payments', data);
  },

  // 查询我的预订记录
  getMyBookings: (): Promise<ApiResponse<Booking[]>> => {
    return apiClient.get('/bookings?sortBy=startTime&sortOrder=desc');
  },

  // 取消预订
  cancelBooking: (bookingId: string): Promise<ApiResponse<null>> => {
    return apiClient.post(`/bookings/${bookingId}/cancel`);
  },
  completeBooking: (bookingId: string): Promise<ApiResponse<null>> => {
    return apiClient.post(`/bookings/${bookingId}/complete`);
  }
};

// ==========================================
// 4. 反馈模块 (对应 Sprint 2 Task 1)
// ==========================================
export const feedbackApi = {
  // 客户：提交反馈
  submitFeedback: (data: {
    content: string;
    category: 'BUG_REPORT' | 'COMPLAINT' | 'SUGGESTION' | 'OTHER';
    bookingId?: number;
    scooterId?: number;
  }): Promise<ApiResponse<null>> => {
    return apiClient.post('/feedback', data);
  },
  // 管理端：获取反馈列表
  getAdminFeedback: (params?: { priority?: 'HIGH' | 'LOW'; status?: 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED'; page?: number; size?: number }): Promise<ApiResponse<PageResponse<Feedback>>> => {
    return apiClient.get('/admin/feedback', { params });
  },
  // 管理端：修改优先级
  updatePriority: (feedbackId: string, data: { priority: 'HIGH' | 'LOW' }): Promise<ApiResponse<Feedback>> => {
    return apiClient.patch(`/admin/feedback/${feedbackId}/priority`, data);
  },
  updateStatus: (feedbackId: string, data: { status: 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED' }): Promise<ApiResponse<Feedback>> => {
    return apiClient.patch(`/admin/feedback/${feedbackId}/status`, data);
  }
};

// ==========================================
// 5. 管理端配置模块 (对应 Sprint 2 Task 4)
// ==========================================
export const adminApi = {
  // 获取所有车辆 (包含不可用)
  getAllScooters: (): Promise<ApiResponse<AdminScooterResponse[]>> => {
    return apiClient.get('/admin/scooters');
  },

  // 创建车辆（如有需要）
  createScooter: (data: AdminScooterRequest): Promise<ApiResponse<AdminScooterResponse>> => {
    return apiClient.post('/admin/scooters', data);
  },

  // 更新车辆 (注意方法改为 PUT，请求体改为 AdminScooterRequest)
  updateScooter: (scooterId: string, data: AdminScooterRequest): Promise<ApiResponse<AdminScooterResponse>> => {
    return apiClient.put(`/admin/scooters/${scooterId}`, data);
  },

  // 删除车辆
  deleteScooter: (scooterId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/scooters/${scooterId}`);
  },

  // 获取所有价格规则（也可复用 scootersApi 中的）
  getPricingRules: (): Promise<ApiResponse<PricingRuleResponse[]>> => {
    return apiClient.get('/pricing-rules');
  },

  // 更新价格规则 (方法改为 PUT，请求体改为 PricingRuleUpdateRequest)
  updatePricingRule: (ruleId: string, data: PricingRuleUpdateRequest): Promise<ApiResponse<PricingRuleResponse>> => {
    return apiClient.put(`/admin/pricing-rules/${ruleId}`, data);
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
  // 获取周收入统计 (路径改为后端实际端点，参数增加 startDate/endDate)
  getWeeklyRevenue: (startDate: string, endDate: string, weekStart?: string): Promise<ApiResponse<WeeklyRevenueStatisticsResponse>> => {
    const params = new URLSearchParams({ startDate, endDate });
    if (weekStart) params.append('weekStart', weekStart);
    return apiClient.get(`/admin/statistics/weekly-revenue?${params.toString()}`);
  }
};
