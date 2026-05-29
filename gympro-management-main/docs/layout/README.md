# Layout Components Documentation

Layout components provide the structural foundation of the GAMA (Gym Admin Management By Asynk) dashboard.

## Components

### 1. Sidebar (`src/components/layout/Sidebar.tsx`)

**Purpose:** Left vertical navigation sidebar with menu items and user profile.

**Connections:**
- **Imports from:**
  - `react-router-dom` - Navigation
  - `framer-motion` - Animations
  - `@/hooks/useAuth` - Authentication and role checking
  - `@/types` - UserRole types
  - `@/components/ui/*` - UI components (Button, Tooltip)

**Links to:**
- **Dashboard** (`src/pages/Dashboard.tsx`) - Navigates to dashboard with tab query params
- **All Feature Components** - Via navigation tabs (members, classes, staff, payments, analytics)

**Functionality:**
- Displays navigation items based on user role
- Highlights active tab
- Shows user profile with avatar
- Provides logout and settings buttons
- Animated entrance and hover effects

**Navigation Items:**
- Overview (all users)
- Members (Staff, Manager, Admin)
- Classes (all users)
- Staff (Manager, Admin)
- Payments (Staff, Manager, Admin)
- Analytics (Manager, Admin)

**Key Features:**
- Role-based menu filtering
- Active state management via URL query params
- Smooth animations on navigation
- **Collapsible sidebar** - Toggle between expanded (256px) and collapsed (80px) states
- **State persistence** - Collapsed state saved in localStorage
- **Icon-only mode** - When collapsed, shows only icons with tooltips
- Responsive design

**Collapsible Functionality:**
- Toggle button in header (chevron icon)
- Smooth width transitions (300ms)
- Text labels fade in/out with animations
- Main content margin adjusts automatically
- State persists across page refreshes

---

### 2. Topbar (`src/components/layout/Topbar.tsx`)

**Purpose:** Sticky top navigation bar with search, notifications, and user menu.

**Connections:**
- **Imports from:**
  - `framer-motion` - Animations
  - `@/hooks/useAuth` - User data and logout
  - `@/components/ui/*` - UI components (Button, Input, DropdownMenu, Avatar, Badge)

**Links to:**
- **Dashboard** - Part of main layout
- **AuthContext** - For logout functionality

**Functionality:**
- Global search bar (placeholder for future search functionality)
- Notification bell with badge count
- User profile dropdown menu
- Logout functionality
- Sticky positioning

**Key Features:**
- Search input with clear button
- Notification badge with animation
- User avatar with initials
- Dropdown menu for account actions
- Backdrop blur effect

---

## Component Dependencies

```
Sidebar
├── Dashboard (uses for navigation)
├── useAuth (for role checking)
└── UI Components (Button, Tooltip)

Topbar
├── Dashboard (uses in layout)
├── useAuth (for user data)
└── UI Components (Button, Input, DropdownMenu, Avatar)
```

## Usage Example

```tsx
// In Dashboard.tsx
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

<Dashboard>
  <Sidebar />
  <div className="ml-64">
    <Topbar />
    <main>...</main>
  </div>
</Dashboard>
```

## Styling

- **Sidebar:** Fixed left position, 256px width, glassmorphism effect
- **Topbar:** Sticky top position, full width, backdrop blur
- **Colors:** Blue/violet gradient theme, no orange/green/red
