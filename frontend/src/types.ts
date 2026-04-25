export interface ApiErrorItem {
  field: string;
  reason: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  code: string;
  message: string;
  data: T;
  requestId: string;
  timestamp: string;
  errors?: ApiErrorItem[];
}

export interface User {
  userId?: string;
  fullName?: string;
  email: string;
  role: string;
  phone?: string;
}

export type HireMode = 'walkIn' | 'remote';

export type PickupStatus = 'pending' | 'verified' | 'expired';

export type ReturnStatus = 'pending' | 'returned';

export type ScooterStatus =
  | 'available'
  | 'reserved'
  | 'unavailable'
  | 'maintenance'
  | 'in_use'
  | 'locked'
  | 'AVAILABLE'
  | 'IN_USE'
  | 'MAINTENANCE'
  | 'LOCKED';

export type AdminScooterStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'LOCKED';

export interface Scooter {
  scooterId: string;
  code: string;
  model?: string;
  status: ScooterStatus;
  location: string;
  basePrice: number;
  batteryLevel?: number;
  topSpeedKph?: number;
  rangeKm?: number;
  motorPowerW?: number;
  imageUrl?: string;
  performanceNote?: string;
}

export interface PricingRule {
  ruleId: string;
  hireType: string;
  durationHours?: number;
  price: number;
  discountEnabled?: boolean;
}

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'ACTIVE'
  | 'PENDING_PICKUP'
  | 'pendingPayment'
  | 'pendingPickup'
  | 'active'
  | 'completed'
  | 'cancelled';

export interface FeeBreakdown {
  baseFeeInCents: number;
  overtimeFeeInCents: number;
  batteryDeltaFeeInCents: number;
  damageFeeInCents: number;
  totalInCents: number;
}

export interface Settlement {
  bookingId: string;
  batteryLevelAtCheckout?: number;
  batteryLevelAtReturn?: number;
  overtimeMinutes?: number;
  damageStatus?: 'none' | 'reported' | 'confirmed';
  fees: FeeBreakdown;
}

export interface Booking {
  bookingId: string;
  scooterId: string;
  scooterName?: string;
  scooter?: Partial<Scooter>;
  hireType: string;
  hireMode?: HireMode;
  startTime: string;
  endTime?: string;
  status: BookingStatus;
  pickupStatus?: PickupStatus;
  returnStatus?: ReturnStatus;
  pickupCode?: string;
  totalCost?: string | number;
  originalCost?: string | number;
  discountAmount?: string | number;
  appliedDiscountType?: string;
  appliedDiscountRate?: string;
  batteryLevelAtCheckout?: number;
  batteryLevelAtReturn?: number;
  settlement?: Settlement;
}

export interface ScooterLocation {
  scooterId: string;
  code: string;
  status: ScooterStatus;
  latitude: number;
  longitude: number;
  locationZone: string;
}

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

export interface ReportItem {
  hireType: string;
  incomeInCents: number;
}

export interface RevenueByHireTypeResponse {
  hireType: string;
  revenue: string;
  paymentCount: number;
}

export interface WeeklyRevenueSummaryResponse {
  weekStart: string;
  weekEnd: string;
  totalRevenue: string;
  paymentCount: number;
  revenueByHireType: RevenueByHireTypeResponse[];
}

export interface WeeklyRevenueStatisticsResponse {
  startDate: string;
  endDate: string;
  totalRevenue: string;
  totalPaymentCount: number;
  empty: boolean;
  weeklyRevenue: WeeklyRevenueSummaryResponse[];
  selectedWeek: WeeklyRevenueSummaryResponse | null;
}

export interface AdminScooterRequest {
  model: string;
  status: AdminScooterStatus;
  batteryLevel: number;
  currentLocation: string;
}

export interface AdminScooterResponse {
  scooterId: string;
  model: string;
  status: AdminScooterStatus;
  batteryLevel: number;
  currentLocation: string;
  createdAt: string;
}

export interface PricingRuleResponse {
  ruleId: string;
  hireType: string;
  durationHours?: number;
  price: number;
  discountEnabled?: boolean;
}

export interface PricingRuleUpdateRequest {
  hireType: string;
  durationHours: number;
  price: number;
}
