# Page Components Documentation

Page components are the main entry points for different routes in the application.

## Components

### 1. Dashboard (`src/pages/Dashboard.tsx`)

**Purpose:** Main dashboard page that orchestrates all feature components and layout.

**Connections:**
- **Imports from:**
  - `react-router-dom` - URL query params for tab management
  - `framer-motion` - Page transitions
  - `@/hooks/useAuth` - User authentication and role checking
  - `@/components/layout/*` - Sidebar and Topbar
  - `@/components/members/*` - MemberManagement
  - `@/components/classes/*` - ClassBooking
  - `@/components/staff/*` - StaffManagement
  - `@/components/payments/*` - PaymentSystem
  - `@/components/analytics/*` - AnalyticsDashboard

**Links to:**
- **Sidebar** - Receives navigation events, updates active tab
- **Topbar** - Displays in header
- **All Feature Components** - Renders based on active tab
- **App.tsx** - Main route entry point

**Functionality:**
- Manages active tab state via URL query params (`?tab=overview`)
- Renders overview dashboard with stats and quick actions
- Conditionally renders feature components based on user role
- Provides smooth page transitions between tabs
- Displays welcome message and key metrics

**Tab Management:**
- `overview` - Default tab, shows stats and recent activity
- `members` - MemberManagement component (requires Staff role)
- `classes` - ClassBooking component (all users)
- `staff` - StaffManagement component (requires Manager role)
- `payments` - PaymentSystem component (requires Staff role)
- `analytics` - AnalyticsDashboard component (requires Manager role)

**Key Features:**
- AnimatedCounter component for number animations
- GlassCard component for glassmorphism effects
- StatCard component for metric display
- RecentActivity component
- QuickActions component
- Role-based access control

**Sub-components:**
- `AnimatedCounter` - Animates numbers from 0 to target value
- `GlassCard` - Glassmorphism card wrapper
- `StatCard` - Metric display card with gradient
- `QuickStats` - Grid of stat cards
- `RecentActivity` - Activity feed
- `QuickActions` - Action buttons grid

---

### 2. Login (`src/pages/Login.tsx`)

**Purpose:** Authentication page for user login.

**Connections:**
- **Imports from:**
  - `@/hooks/useAuth` - Login functionality
  - `react-router-dom` - Navigation after login

**Links to:**
- **AuthContext** - For authentication
- **Dashboard** - Redirects after successful login

**Functionality:**
- User login form
- Email/password authentication
- Error handling
- Redirect to dashboard on success

---

## Component Dependencies

```
Dashboard
├── Layout Components
│   ├── Sidebar
│   └── Topbar
├── Feature Components
│   ├── MemberManagement
│   ├── ClassBooking
│   ├── StaffManagement
│   ├── PaymentSystem
│   └── AnalyticsDashboard
└── Hooks
    └── useAuth
```

## URL Structure

```
/dashboard              → Overview tab (default)
/dashboard?tab=members → Members tab
/dashboard?tab=classes → Classes tab
/dashboard?tab=staff    → Staff tab
/dashboard?tab=payments → Payments tab
/dashboard?tab=analytics → Analytics tab
```

## Usage Example

```tsx
// In App.tsx
<Route path="/dashboard" element={<Dashboard />} />

// Navigation from Sidebar
navigate('/dashboard?tab=members');
```

## State Management

- **Active Tab:** Managed via URL query params
- **User Data:** From useAuth hook
- **Role Permissions:** Checked via hasRole() function

