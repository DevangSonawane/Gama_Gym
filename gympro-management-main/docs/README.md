# GAMA Dashboard Documentation

This documentation provides a comprehensive overview of all components, their connections, and functionality in the GAMA (Gym Admin Management By Asynk) system.

## Documentation Structure

- [Layout Components](./layout/README.md)
- [Page Components](./pages/README.md)
- [Feature Components](./features/README.md)
- [UI Components](./ui/README.md)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    App.tsx (Root)                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │              AuthProvider (Context)               │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │         Dashboard (Main Page)               │  │   │
│  │  │  ┌──────────────┐  ┌──────────────────┐   │  │   │
│  │  │  │   Sidebar    │  │     Topbar       │   │  │   │
│  │  │  └──────────────┘  └──────────────────┘   │  │   │
│  │  │  ┌──────────────────────────────────────┐ │  │   │
│  │  │  │     Feature Components (Tabs)          │ │  │   │
│  │  │  │  - MemberManagement                    │ │  │   │
│  │  │  │  - ClassBooking                        │ │  │   │
│  │  │  │  - StaffManagement                     │ │  │   │
│  │  │  │  - PaymentSystem                       │ │  │   │
│  │  │  │  - AnalyticsDashboard                  │ │  │   │
│  │  │  └──────────────────────────────────────┘ │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Component Relationships

### Core Flow
1. **App.tsx** → Initializes routing and authentication
2. **Dashboard** → Main container with layout components
3. **Sidebar & Topbar** → Navigation and header
4. **Feature Components** → Business logic and data management
5. **UI Components** → Reusable UI elements

### Data Flow
- **AuthContext** → Provides authentication state to all components
- **useAuth Hook** → Access authentication and role-based permissions
- **Components** → Fetch and manage their own data (currently mock data)

## Quick Links

- [Getting Started](./GETTING_STARTED.md)
- [Component Index](./COMPONENT_INDEX.md)
- [API Integration Guide](./API_INTEGRATION.md)
- [Changelog](./CHANGELOG.md) - Recent updates and new features

## Recent Updates

### ✨ New Features
- **Collapsible Sidebar** - Toggle between expanded and collapsed states
- **Edit Functionality** - Edit members and staff with pre-filled forms
- **View Functionality** - View detailed member information
- **Delete Functionality** - Remove members and staff with confirmation
- **Blue Color Theme** - Unified blue color palette throughout

See [Changelog](./CHANGELOG.md) for complete details.
