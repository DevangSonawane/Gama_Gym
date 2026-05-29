import { ApiResponse, PaginatedResponse, User, Member, Staff, Class, ClassSchedule, Booking, Payment, Equipment, MaintenanceRecord, Attendance, Notification, MembershipType, PromoCode, AnalyticsData } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('authToken');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request<void>('/auth/logout', { method: 'POST' });
  }

  async refreshToken() {
    return this.request<{ token: string }>('/auth/refresh', { method: 'POST' });
  }

  // Members
  async getMembers(page = 1, limit = 10, search = '') {
    return this.request<PaginatedResponse<Member>>(`/members?page=${page}&limit=${limit}&search=${search}`);
  }

  async getMember(id: string) {
    return this.request<Member>(`/members/${id}`);
  }

  async createMember(memberData: Partial<Member>) {
    return this.request<Member>('/members', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  }

  async updateMember(id: string, memberData: Partial<Member>) {
    return this.request<Member>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memberData),
    });
  }

  async deleteMember(id: string) {
    return this.request<void>(`/members/${id}`, { method: 'DELETE' });
  }

  // Classes
  async getClasses(page = 1, limit = 10) {
    return this.request<PaginatedResponse<Class>>(`/classes?page=${page}&limit=${limit}`);
  }

  async getClass(id: string) {
    return this.request<Class>(`/classes/${id}`);
  }

  async createClass(classData: Partial<Class>) {
    return this.request<Class>('/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  }

  async updateClass(id: string, classData: Partial<Class>) {
    return this.request<Class>(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(classData),
    });
  }

  async deleteClass(id: string) {
    return this.request<void>(`/classes/${id}`, { method: 'DELETE' });
  }

  // Class Schedules
  async getClassSchedules(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return this.request<ClassSchedule[]>(`/class-schedules?${params.toString()}`);
  }

  async createClassSchedule(scheduleData: Partial<ClassSchedule>) {
    return this.request<ClassSchedule>('/class-schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  }

  // Bookings
  async getBookings(memberId?: string, classScheduleId?: string) {
    const params = new URLSearchParams();
    if (memberId) params.append('memberId', memberId);
    if (classScheduleId) params.append('classScheduleId', classScheduleId);
    
    return this.request<Booking[]>(`/bookings?${params.toString()}`);
  }

  async createBooking(bookingData: Partial<Booking>) {
    return this.request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async cancelBooking(id: string) {
    return this.request<void>(`/bookings/${id}/cancel`, { method: 'POST' });
  }

  // Staff
  async getStaff(page = 1, limit = 10) {
    return this.request<PaginatedResponse<Staff>>(`/staff?page=${page}&limit=${limit}`);
  }

  async getStaffMember(id: string) {
    return this.request<Staff>(`/staff/${id}`);
  }

  async createStaffMember(staffData: Partial<Staff>) {
    return this.request<Staff>('/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  }

  async updateStaffMember(id: string, staffData: Partial<Staff>) {
    return this.request<Staff>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffData),
    });
  }

  // Payments
  async getPayments(memberId?: string, page = 1, limit = 10) {
    const params = new URLSearchParams();
    if (memberId) params.append('memberId', memberId);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    return this.request<PaginatedResponse<Payment>>(`/payments?${params.toString()}`);
  }

  async createPayment(paymentData: Partial<Payment>) {
    return this.request<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async processStripePayment(paymentData: Record<string, unknown>) {
    return this.request<Payment>('/payments/stripe', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async processPayPalPayment(paymentData: Record<string, unknown>) {
    return this.request<Payment>('/payments/paypal', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // Equipment
  async getEquipment(page = 1, limit = 10) {
    return this.request<PaginatedResponse<Equipment>>(`/equipment?page=${page}&limit=${limit}`);
  }

  async createEquipment(equipmentData: Partial<Equipment>) {
    return this.request<Equipment>('/equipment', {
      method: 'POST',
      body: JSON.stringify(equipmentData),
    });
  }

  async updateEquipment(id: string, equipmentData: Partial<Equipment>) {
    return this.request<Equipment>(`/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(equipmentData),
    });
  }

  // Maintenance
  async getMaintenanceRecords(equipmentId?: string) {
    const params = equipmentId ? `?equipmentId=${equipmentId}` : '';
    return this.request<MaintenanceRecord[]>(`/maintenance${params}`);
  }

  async createMaintenanceRecord(maintenanceData: Partial<MaintenanceRecord>) {
    return this.request<MaintenanceRecord>('/maintenance', {
      method: 'POST',
      body: JSON.stringify(maintenanceData),
    });
  }

  // Analytics
  async getAnalytics() {
    return this.request<AnalyticsData>('/analytics');
  }

  async getMemberStats() {
    return this.request<AnalyticsData['memberStats']>('/analytics/members');
  }

  async getRevenueStats() {
    return this.request<AnalyticsData['revenueStats']>('/analytics/revenue');
  }

  async getClassStats() {
    return this.request<AnalyticsData['classStats']>('/analytics/classes');
  }

  // Attendance
  async recordAttendance(attendanceData: Partial<Attendance>) {
    return this.request<Attendance>('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  async getAttendance(memberId?: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (memberId) params.append('memberId', memberId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return this.request<Attendance[]>(`/attendance?${params.toString()}`);
  }

  // Notifications
  async getNotifications(userId: string) {
    return this.request<Notification[]>(`/notifications?userId=${userId}`);
  }

  async markNotificationAsRead(id: string) {
    return this.request<void>(`/notifications/${id}/read`, { method: 'POST' });
  }

  // Membership Types
  async getMembershipTypes() {
    return this.request<MembershipType[]>('/membership-types');
  }

  async createMembershipType(typeData: Partial<MembershipType>) {
    return this.request<MembershipType>('/membership-types', {
      method: 'POST',
      body: JSON.stringify(typeData),
    });
  }

  // Promo Codes
  async getPromoCodes() {
    return this.request<PromoCode[]>('/promo-codes');
  }

  async validatePromoCode(code: string) {
    return this.request<PromoCode>(`/promo-codes/validate/${code}`);
  }

  async createPromoCode(promoData: Partial<PromoCode>) {
    return this.request<PromoCode>('/promo-codes', {
      method: 'POST',
      body: JSON.stringify(promoData),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;