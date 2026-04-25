import apiClient from './client';
import type {
  AdminScooterRequest,
  AdminScooterResponse,
  ApiResponse,
  Booking,
  Feedback,
  PageResponse,
  PricingRule,
  PricingRuleResponse,
  PricingRuleUpdateRequest,
  Scooter,
  ScooterLocation,
  Settlement,
  User,
  WeeklyRevenueStatisticsResponse,
} from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  fullName: string;
  phone: string;
}

export interface BookingCreatePayload {
  scooterId: string;
  rentalOptionId?: string;
  hireType?: string;
  startTime: string;
}

export interface BookingPaymentPayload {
  bookingId: string;
  paymentMethod?: string;
}

export interface PickupVerificationPayload {
  pickupCode: string;
  verifiedBy?: string;
}

export interface ReturnPayload {
  batteryLevelAtReturn: number;
  returnedBy?: string;
  notes?: string;
}

export interface DamageReportPayload {
  description: string;
  estimatedFeeInCents?: number;
}

export interface WalkInCustomerPayload {
  customerName: string;
  customerPhone: string;
  cardToken: string;
}

export interface WalkInRentalPayload extends WalkInCustomerPayload {
  scooterId: string;
  hireType: string;
  batteryLevelAtCheckout: number;
  liabilityConsent: boolean;
}

export const authApi = {
  login: (data: LoginPayload): Promise<ApiResponse<{ token: string; user: User }>> => {
    return apiClient.post('/auth/login', data);
  },
  register: (data: RegisterPayload): Promise<ApiResponse<{ token: string; user: User }>> => {
    return apiClient.post('/auth/register', data);
  },
  getMe: (): Promise<ApiResponse<User>> => {
    return apiClient.get('/users/me');
  },
};

export const scootersApi = {
  getScooters: (): Promise<ApiResponse<Scooter[]>> => {
    return apiClient.get('/scooters');
  },
  getScooter: (scooterId: string): Promise<ApiResponse<Scooter>> => {
    return apiClient.get(`/scooters/${scooterId}`);
  },
  getPricingRules: (): Promise<ApiResponse<PricingRule[]>> => {
    return apiClient.get('/pricing-rules');
  },
};

export const bookingsApi = {
  createBooking: (
    data: BookingCreatePayload,
  ): Promise<ApiResponse<{ bookingId: string; status: string }>> => {
    return apiClient.post('/bookings', data);
  },
  payBooking: (data: BookingPaymentPayload): Promise<ApiResponse<null>> => {
    return apiClient.post('/payments', data);
  },
  getMyBookings: (): Promise<ApiResponse<Booking[]>> => {
    return apiClient.get('/bookings?sortBy=startTime&sortOrder=desc&includeSettlement=true');
  },
  getBookingDetail: (bookingId: string): Promise<ApiResponse<Booking>> => {
    return apiClient.get(`/bookings/${bookingId}`);
  },
  cancelBooking: (bookingId: string): Promise<ApiResponse<null>> => {
    return apiClient.post(`/bookings/${bookingId}/cancel`);
  },
  completeBooking: (bookingId: string): Promise<ApiResponse<null>> => {
    return apiClient.post(`/bookings/${bookingId}/complete`);
  },
  verifyPickup: (
    bookingId: string,
    data: PickupVerificationPayload,
  ): Promise<ApiResponse<Booking>> => {
    return apiClient.post(`/bookings/${bookingId}/pickup-verifications`, data);
  },
  createReturn: (bookingId: string, data: ReturnPayload): Promise<ApiResponse<Booking>> => {
    return apiClient.post(`/bookings/${bookingId}/returns`, data);
  },
  reportDamage: (
    bookingId: string,
    data: DamageReportPayload,
  ): Promise<ApiResponse<null>> => {
    return apiClient.post(`/bookings/${bookingId}/damage-reports`, data);
  },
  getSettlement: (bookingId: string): Promise<ApiResponse<Settlement>> => {
    return apiClient.get(`/bookings/${bookingId}/settlement`);
  },
};

export const walkInApi = {
  createCustomer: (
    data: WalkInCustomerPayload,
  ): Promise<ApiResponse<{ customerId: string }>> => {
    return apiClient.post('/walk-in/customers', data);
  },
  createRental: (
    data: WalkInRentalPayload,
  ): Promise<ApiResponse<{ bookingId: string; hireMode: string; status: string }>> => {
    return apiClient.post('/walk-in/rentals', data);
  },
};

export const feedbackApi = {
  submitFeedback: (data: {
    content: string;
    category: 'BUG_REPORT' | 'COMPLAINT' | 'SUGGESTION' | 'OTHER';
    bookingId?: number;
    scooterId?: number;
  }): Promise<ApiResponse<null>> => {
    return apiClient.post('/feedback', data);
  },
  getAdminFeedback: (params?: {
    priority?: 'HIGH' | 'LOW';
    status?: 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED';
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageResponse<Feedback>>> => {
    return apiClient.get('/admin/feedback', { params });
  },
  updatePriority: (
    feedbackId: string,
    data: { priority: 'HIGH' | 'LOW' },
  ): Promise<ApiResponse<Feedback>> => {
    return apiClient.patch(`/admin/feedback/${feedbackId}/priority`, data);
  },
  updateStatus: (
    feedbackId: string,
    data: { status: 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED' },
  ): Promise<ApiResponse<Feedback>> => {
    return apiClient.patch(`/admin/feedback/${feedbackId}/status`, data);
  },
};

export const adminApi = {
  getAllScooters: (): Promise<ApiResponse<AdminScooterResponse[]>> => {
    return apiClient.get('/admin/scooters');
  },
  createScooter: (data: AdminScooterRequest): Promise<ApiResponse<AdminScooterResponse>> => {
    return apiClient.post('/admin/scooters', data);
  },
  updateScooter: (
    scooterId: string,
    data: AdminScooterRequest,
  ): Promise<ApiResponse<AdminScooterResponse>> => {
    return apiClient.put(`/admin/scooters/${scooterId}`, data);
  },
  deleteScooter: (scooterId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/scooters/${scooterId}`);
  },
  getPricingRules: (): Promise<ApiResponse<PricingRuleResponse[]>> => {
    return apiClient.get('/pricing-rules');
  },
  updatePricingRule: (
    ruleId: string,
    data: PricingRuleUpdateRequest,
  ): Promise<ApiResponse<PricingRuleResponse>> => {
    return apiClient.put(`/admin/pricing-rules/${ruleId}`, data);
  },
  runOverdueExecution: (): Promise<ApiResponse<{ executed: boolean }>> => {
    return apiClient.post('/admin/overdue-jobs/executions');
  },
};

export const mapsApi = {
  getLocations: (onlyAvailable = true): Promise<ApiResponse<ScooterLocation[]>> => {
    return apiClient.get(`/scooters/locations?onlyAvailable=${onlyAvailable}`);
  },
};

export const reportsApi = {
  getWeeklyRevenue: (
    startDate: string,
    endDate: string,
    weekStart?: string,
  ): Promise<ApiResponse<WeeklyRevenueStatisticsResponse>> => {
    const params = new URLSearchParams({ startDate, endDate });
    if (weekStart) {
      params.append('weekStart', weekStart);
    }
    return apiClient.get(`/admin/statistics/weekly-revenue?${params.toString()}`);
  },
};
