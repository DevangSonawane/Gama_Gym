# Component Index

Quick reference guide for all components and their locations.

## Layout Components

| Component | Path | Purpose | Connected To |
|-----------|------|---------|--------------|
| Sidebar | `src/components/layout/Sidebar.tsx` | Left navigation (collapsible) | Dashboard, All feature components |
| Topbar | `src/components/layout/Topbar.tsx` | Top header bar | Dashboard, AuthContext |

## Page Components

| Component | Path | Purpose | Connected To |
|-----------|------|---------|--------------|
| Dashboard | `src/pages/Dashboard.tsx` | Main dashboard | All layout & feature components |
| Login | `src/pages/Login.tsx` | Authentication | AuthContext, Dashboard |

## Feature Components

| Component | Path | Purpose | Connected To |
|-----------|------|---------|--------------|
| MemberManagement | `src/components/members/MemberManagement.tsx` | Member management | Dashboard, BulkUploadModal |
| BulkUploadModal | `src/components/members/BulkUploadModal.tsx` | CSV bulk upload | MemberManagement |
| ClassBooking | `src/components/classes/ClassBooking.tsx` | Class booking | Dashboard |
| StaffManagement | `src/components/staff/StaffManagement.tsx` | Staff management | Dashboard |
| PaymentSystem | `src/components/payments/PaymentSystem.tsx` | Payment processing | Dashboard, PaymentStatus |
| PaymentStatus | `src/components/payments/PaymentStatus.tsx` | Payment status view | PaymentSystem |
| AnalyticsDashboard | `src/components/analytics/AnalyticsDashboard.tsx` | Analytics & reports | Dashboard |

## UI Components

| Component | Path | Used In |
|-----------|------|---------|
| Button | `src/components/ui/button.tsx` | All components |
| Card | `src/components/ui/card.tsx` | All feature components |
| Input | `src/components/ui/input.tsx` | Forms, search bars |
| Select | `src/components/ui/select.tsx` | Filters, dropdowns |
| Table | `src/components/ui/table.tsx` | Data tables |
| Dialog | `src/components/ui/dialog.tsx` | Modals, forms |
| Badge | `src/components/ui/badge.tsx` | Status indicators |
| Avatar | `src/components/ui/avatar.tsx` | User profiles |
| Tabs | `src/components/ui/tabs.tsx` | Tab navigation |

## Core Files

| File | Path | Purpose |
|------|------|---------|
| App | `src/App.tsx` | Root component, routing |
| AuthContext | `src/contexts/AuthContext.tsx` | Authentication state |
| useAuth | `src/hooks/useAuth.ts` | Auth hook |
| Types | `src/types/index.ts` | TypeScript definitions |
| API Client | `src/lib/api.ts` | API calls (future) |

## Component Hierarchy

```
App.tsx
└── AuthProvider
    └── BrowserRouter
        └── Routes
            ├── Login
            └── Dashboard
                ├── Sidebar
                ├── Topbar
                └── Feature Components (tabs)
                    ├── MemberManagement
                    │   └── BulkUploadModal
                    ├── ClassBooking
                    ├── StaffManagement
                    ├── PaymentSystem
                    │   └── PaymentStatus
                    └── AnalyticsDashboard
```

## Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
State Update / API Call
    ↓
UI Re-render
    ↓
User Feedback
```

## Navigation Flow

```
Sidebar Click
    ↓
Navigate with query param
    ↓
Dashboard reads query param
    ↓
Renders corresponding feature component
```

