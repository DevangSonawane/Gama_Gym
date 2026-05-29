# Getting Started with GAMA Dashboard

This guide will help you understand the codebase structure and how components are connected.

## Project Structure

```
workspace/gympro-management/
├── src/
│   ├── components/
│   │   ├── layout/          # Sidebar, Topbar
│   │   ├── members/         # MemberManagement, BulkUploadModal
│   │   ├── classes/         # ClassBooking
│   │   ├── staff/           # StaffManagement
│   │   ├── payments/        # PaymentSystem, PaymentStatus
│   │   ├── analytics/       # AnalyticsDashboard
│   │   └── ui/              # Reusable UI components
│   ├── pages/               # Dashboard, Login, Settings, Profile, Users...
│   ├── contexts/            # AuthContext
│   ├── hooks/               # useAuth, use-mobile, use-toast
│   ├── types/               # TypeScript definitions
│   ├── lib/                 # Utilities, Supabase client, Auth utils
│   └── App.tsx              # Root component
└── docs/                    # Documentation
    ├── project-documentation/ # Detailed project docs
    ├── layout/              # Layout component docs
    ├── pages/               # Page component docs
    ├── features/            # Feature component docs
    └── ui/                  # UI component docs
```

## Key Concepts

### 1. Component Connections

Components are connected through:
- **Import statements** - Direct dependencies
- **Props** - Data passing
- **Context** - Shared state (AuthContext)
- **Hooks** - Shared logic (useAuth)
- **URL routing** - Navigation between pages

### 2. Authentication Flow

```
User Login
    ↓
AuthContext updates
    ↓
useAuth hook provides state
    ↓
Components check roles
    ↓
Conditional rendering
```

### 3. Navigation Flow

```
Sidebar Click
    ↓
navigate('/dashboard?tab=members')
    ↓
Dashboard reads ?tab=members
    ↓
Renders MemberManagement component
```

## Reading the Documentation

Each component folder contains:
1. **README.md** - Overview, connections, functionality
2. **Component relationships** - What it imports and links to
3. **Functionality** - What it does
4. **Key features** - Important capabilities

## Quick Reference

### Find Component Connections

1. Open component file
2. Check imports (what it uses)
3. Check exports (what uses it)
4. Check documentation in `docs/` folder

### Understand Data Flow

1. Check component's state management
2. Look for API calls or data fetching
3. Trace props and context usage
4. Review component documentation

### Navigate Between Components

1. Use Sidebar for main navigation
2. Check Dashboard for tab management
3. Review feature component docs for sub-navigation
4. Check URL query params for state

## Next Steps

1. Read [Component Index](./COMPONENT_INDEX.md) for quick reference
2. Explore [Layout Components](./layout/README.md) for structure
3. Review [Feature Components](./features/README.md) for business logic
4. Check [UI Components](./ui/README.md) for reusable elements

## Tips

- **Start with Dashboard** - It's the orchestrator
- **Follow the imports** - Shows component dependencies
- **Check the types** - Understand data structures
- **Review hooks** - Understand shared logic
- **Read component docs** - Detailed functionality

