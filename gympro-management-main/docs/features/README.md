# Feature Components Documentation

Feature components contain the business logic and data management for specific gym management features.

## Components

### 1. MemberManagement (`src/components/members/MemberManagement.tsx`)

**Purpose:** Manage gym members, their information, and memberships.

**Connections:**
- **Imports from:**
  - `@/types` - Member, UserRole types
  - `@/hooks/useAuth` - Role checking
  - `@/components/ui/*` - UI components
  - `@/components/members/BulkUploadModal` - Bulk upload functionality

**Links to:**
- **Dashboard** - Rendered in members tab
- **BulkUploadModal** - For CSV bulk member upload
- **Member Forms** - Add/Edit member dialogs

**Functionality:**
- Display member list with search and filtering
- Add new members via form dialog
- Bulk upload members from CSV
- Filter by membership type
- View member details
- Calculate member age
- Display membership statistics

**Key Features:**
- Search members by name/email
- Filter by membership type (Gym, Gym + Cardio, Full Package)
- Stat cards showing member counts
- Animated table rows
- Glassmorphism card design
- **View member details** - Full member information dialog
- **Edit member** - Update member information with pre-filled form
- **Delete member** - Remove members with confirmation
- Role-based access control for edit/delete actions

**Data Structure:**
- Members array with full profile data
- Membership types and pricing
- Active/inactive status

---

### 2. ClassBooking (`src/components/classes/ClassBooking.tsx`)

**Purpose:** Manage fitness classes, schedules, and bookings.

**Connections:**
- **Imports from:**
  - `@/types` - Class, ClassSchedule, Booking types
  - `@/hooks/useAuth` - User role checking
  - `@/components/ui/*` - UI components

**Links to:**
- **Dashboard** - Rendered in classes tab
- **Class Forms** - Add new class dialog
- **Booking Dialog** - Book class confirmation

**Functionality:**
- Display available classes with schedules
- Search classes by name or instructor
- Filter by category (Yoga, Cardio, Strength, etc.)
- Book classes for members
- Add new classes
- View class availability
- Manage waitlists

**Key Features:**
- Class schedule table
- Availability indicators
- Difficulty level badges
- Instructor information
- Room/location details
- Booking capacity tracking

**Data Structure:**
- Classes with instructor, capacity, duration
- Class schedules with dates/times
- Bookings with member associations
- Room assignments

---

### 3. StaffManagement (`src/components/staff/StaffManagement.tsx`)

**Purpose:** Manage staff members, schedules, and employment details.

**Connections:**
- **Imports from:**
  - `@/types` - Staff, UserRole, WorkSchedule types
  - `@/hooks/useAuth` - Role checking (Manager only)
  - `@/components/ui/*` - UI components

**Links to:**
- **Dashboard** - Rendered in staff tab (Manager role only)
- **Staff Forms** - Add/Edit staff dialogs
- **Staff Details Dialog** - View full staff information

**Functionality:**
- Display staff directory
- Add new staff members
- View staff details (schedule, certifications, etc.)
- Filter by department
- Search staff by name/email/ID
- Display staff statistics

**Key Features:**
- Department badges (Fitness, Operations, Management)
- Role badges (Trainer, Staff, Manager)
- Schedule display
- Certification tracking
- Salary information
- Hire date tracking
- **View staff details** - Full staff information dialog
- **Edit staff** - Update staff information with pre-filled form
- **Delete staff** - Remove staff members with confirmation
- Role-based access control (Manager only for edit/delete)

**Data Structure:**
- Staff array with employment details
- Work schedules by day of week
- Certifications and specializations
- Department assignments

---

### 4. PaymentSystem (`src/components/payments/PaymentSystem.tsx`)

**Purpose:** Manage payments, invoices, and promotional codes.

**Connections:**
- **Imports from:**
  - `@/types` - Payment, Invoice, PromoCode types
  - `@/hooks/useAuth` - Role checking
  - `@/components/payments/PaymentStatus` - Payment status component
  - `@/components/ui/*` - UI components

**Links to:**
- **Dashboard** - Rendered in payments tab
- **PaymentStatus** - Payment status dashboard
- **Payment Forms** - Process payment dialog
- **PromoCode Forms** - Create promo code dialog

**Functionality:**
- Process payments for members
- View payment history
- Filter by payment status
- Create promotional codes
- Manage invoices
- Display payment statistics
- Track payment methods (Stripe, PayPal, Cash, Bank Transfer)

**Key Features:**
- Payment status tabs (Status, History, Invoices, Promo Codes)
- Payment method badges
- Status indicators (Completed, Pending, Overdue, Failed)
- Revenue statistics
- Transaction ID tracking
- Promo code management

**Data Structure:**
- Payments with amounts, methods, status
- Invoices linked to payments
- Promo codes with usage limits
- Payment history

---

### 5. AnalyticsDashboard (`src/components/analytics/AnalyticsDashboard.tsx`)

**Purpose:** Display business analytics and performance metrics.

**Connections:**
- **Imports from:**
  - `@/types` - AnalyticsData types
  - `@/components/ui/*` - UI components

**Links to:**
- **Dashboard** - Rendered in analytics tab (Manager role only)

**Functionality:**
- Display member statistics
- Revenue analytics
- Class performance metrics
- Trainer performance
- Equipment statistics
- Retention rates
- Utilization metrics

**Key Features:**
- Metric cards with trends
- Progress bars for distributions
- Popular classes ranking
- Top trainer performers
- Revenue breakdown by service
- Period selection (7d, 30d, 90d, 1y)

**Data Structure:**
- MemberStats (total, active, retention, visits)
- RevenueStats (total, monthly, growth, by service)
- ClassStats (total, attendance, popular classes)
- TrainerStats (total, ratings, top performers)
- EquipmentStats (total, available, maintenance)

**Tabs:**
- Members - Member analytics
- Revenue - Financial metrics
- Classes - Class performance
- Trainers - Staff performance

---

## Component Relationships

```
Dashboard
├── MemberManagement
│   └── BulkUploadModal
├── ClassBooking
├── StaffManagement
├── PaymentSystem
│   └── PaymentStatus
└── AnalyticsDashboard
```

## Data Flow

1. **Components fetch data** (currently mock data)
2. **User interactions** trigger state updates
3. **Forms submit** create/update records
4. **Filters/search** filter displayed data
5. **Role checks** control component visibility

## Common Patterns

All feature components follow similar patterns:
- Search functionality
- Filter options
- Stat cards at top
- Data tables/lists
- Add/Create dialogs
- Role-based access
- Animated UI elements
- Glassmorphism design

