// Base User interface
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// User roles
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  TRAINER = 'TRAINER',
  STAFF = 'STAFF',
  MEMBER = 'MEMBER'
}

// Member-specific interface
export interface Member extends User {
  dateOfBirth: Date;
  address?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lbs';
  height?: number;
  heightUnit?: 'cm' | 'ft';
  heightFeet?: number; // For ft+in format
  heightInches?: number; // For ft+in format
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  membershipType: 'Gym' | 'Gym + Cardio' | 'Gym + Cardio + Crossfit';
  planPrice?: number;
  membershipStartDate: Date;
  membershipEndDate: Date;
  isActive: boolean;
  medicalConditions?: string[];
  fitnessGoals?: string[];
  notes?: string;
}

// Staff interface
export interface Staff extends User {
  employeeId: string;
  position: string;
  department: string;
  hireDate: Date;
  salary: number;
  schedule: WorkSchedule[];
  certifications?: string[];
  specializations?: string[];
  bio?: string;
  profileImage?: string;
  yearsExperience?: number;
}

// Trainer interface
export interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization?: string[];
  bio?: string;
  profileImage?: string;
  gymId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Work schedule
export interface WorkSchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string;
  endTime: string;
  isActive: boolean;
}

// Class interface
export interface Class {
  id: string;
  name: string;
  description: string;
  instructorId: string;
  instructor?: Trainer;
  capacity: number;
  duration: number; // in minutes
  price: number;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment?: string[];
  isActive: boolean;
}

// Room interface
export interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment?: string[];
  amenities?: string[];
  isActive: boolean;
}

// Class schedule
export interface ClassSchedule {
  id: string;
  gymId: string;
  classId: string;
  class: Class;
  date: Date;
  startTime: string;
  endTime: string;
  roomId: string;
  room: Room;
  bookedCount: number;
  waitlistCount: number;
  status: 'scheduled' | 'cancelled' | 'completed';
}

// Booking interface
export interface Booking {
  id: string;
  memberId: string;
  member?: Member;
  classScheduleId: string;
  classSchedule?: ClassSchedule;
  bookingDate: Date;
  status: BookingStatus;
  paymentId?: string;
  notes?: string;
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  WAITLISTED = 'WAITLISTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW'
}

// Payment interfaces
export interface Payment {
  id: string;
  memberId: string;
  amount: number;
  currency: string;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  description: string;
  transactionId?: string;
  invoiceId?: string;
  paidDate?: Date;
  dueDate: Date;
  refundedDate?: Date;
  refundAmount?: number;
}

export enum PaymentType {
  MEMBERSHIP = 'MEMBERSHIP',
  CLASS = 'CLASS',
  PERSONAL_TRAINING = 'PERSONAL_TRAINING',
  EQUIPMENT_RENTAL = 'EQUIPMENT_RENTAL',
  LATE_FEE = 'LATE_FEE',
  OTHER = 'OTHER'
}

export enum PaymentMethod {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  OVERDUE = 'OVERDUE',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

// Invoice interface
export interface Invoice {
  id: string;
  memberId: string;
  invoiceNumber?: string;
  amount: number;
  currency: string;
  description: string;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  gstin?: string;
  businessName?: string;
  billingAddress?: string;
  hsnSac?: string;
  cgstRate?: number;
  sgstRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  subtotal?: number;
  total?: number;
  customerName?: string;
  customerEmail?: string;
  logoUrl?: string;
  pdfUrl?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  hsnSac?: string;
}

// Equipment interface
export interface Equipment {
  id: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiry?: Date;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_order';
  location?: string;
  notes?: string;
}

// Maintenance record
export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  equipment?: Equipment;
  type: 'routine' | 'repair' | 'inspection';
  description: string;
  performedBy: string;
  performedDate: Date;
  cost?: number;
  nextMaintenanceDate?: Date;
  notes?: string;
}

// Attendance interface
export interface Attendance {
  id: string;
  memberId: string;
  member?: Member;
  checkInTime: Date;
  checkOutTime?: Date;
  classScheduleId?: string;
  classSchedule?: ClassSchedule;
  notes?: string;
}

// Notification interface
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// Membership type interface
export interface MembershipType {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in months
  features: string[];
  isActive: boolean;
}

// Promo code interface
export interface PromoCode {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  validFrom: Date;
  validTo: Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  applicableServices: string[];
}

// Analytics interfaces
export interface AnalyticsData {
  memberStats: MemberStats;
  revenueStats: RevenueStats;
  classStats: ClassStats;
  trainerStats: TrainerStats;
  equipmentStats: EquipmentStats;
}

export interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  retentionRate: number;
  averageVisitsPerMember: number;
  membershipDistribution: Record<string, number>;
}

export interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  revenueByService: Record<string, number>;
  outstandingPayments: number;
}

export interface ClassStats {
  totalClasses: number;
  averageAttendance: number;
  popularClasses: Array<{ name: string; bookings: number }>;
  classUtilization: number;
}

export interface TrainerStats {
  totalTrainers: number;
  averageRating: number;
  topPerformers: Array<{ name: string; rating: number; classes: number }>;
}

export interface EquipmentStats {
  totalEquipment: number;
  availableEquipment: number;
  maintenanceRequired: number;
  utilizationRate: number;
}

// API Response interfaces
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form interfaces
export interface LoginForm {
  email: string;
  password: string;
}

export interface MemberForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  weight: string;
  weightUnit: 'kg' | 'lbs';
  height: string;
  heightUnit: 'cm' | 'ft';
  heightFeet: string;
  heightInches: string;
  membershipType: 'Gym' | 'Gym + Cardio' | 'Gym + Cardio + Crossfit';
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  medicalConditions: string;
  fitnessGoals: string;
  notes: string;
}
