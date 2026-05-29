# GymPro / GAMA Dashboard

GymPro (also called GAMA - Gym Admin Management By Asynk) is a comprehensive web dashboard for gym owners and staff. It facilitates the management of members, classes, staff, payments, analytics, and system users with a modern, animated UI.

## 📚 Documentation

For a detailed explanation of the project, including architecture, features, and data flow, please refer to the **[Project Documentation](docs/project-documentation/PROJECT_DOCUMENTATION.md)**.

Other useful documentation:
- [Authentication Setup](AUTHENTICATION_SETUP.md)
- [Supabase Integration Status](SUPABASE_INTEGRATION_STATUS.md)
- [Feature Components](docs/features/README.md)

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- pnpm

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm run dev
   ```

3. Open your browser at `http://localhost:8080` (or the port shown in the terminal).

### Build for Production

```bash
pnpm run build
```

## 🛠 Tech Stack

- **Frontend:** React, TypeScript, Vite
- **UI:** Tailwind CSS, shadcn/ui, framer-motion
- **Backend/Data:** Supabase, React Query
- **Icons:** Lucide React

## 🔑 Key Features

- **Dashboard:** Overview of gym statistics.
- **Member Management:** Add, edit, view, and delete members. Bulk upload supported.
- **Class Management:** Schedule classes, manage instructors and bookings.
- **Staff Management:** Track staff details and schedules.
- **Payments:** Manage invoices, payments, and promo codes.
- **Analytics:** Visual insights into gym performance.
- **User Management:** Role-based access control (Admin, Manager, Staff, Trainer, Member).
- **Settings:** Application preferences.
