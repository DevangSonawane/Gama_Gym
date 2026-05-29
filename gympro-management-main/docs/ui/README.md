# UI Components Documentation

UI components are reusable interface elements built on shadcn/ui and Radix UI primitives.

## Component Categories

### Form Components

#### Input (`src/components/ui/input.tsx`)
- Text input fields
- Used in: All forms, search bars
- Connections: Form components, search functionality

#### Select (`src/components/ui/select.tsx`)
- Dropdown select menus
- Used in: Filters, form selects
- Connections: All feature components for filtering

#### Textarea (`src/components/ui/textarea.tsx`)
- Multi-line text input
- Used in: Member forms, class descriptions
- Connections: MemberManagement, ClassBooking

#### Label (`src/components/ui/label.tsx`)
- Form field labels
- Used in: All forms
- Connections: Input, Select, Textarea components

---

### Display Components

#### Card (`src/components/ui/card.tsx`)
- Container card component
- Used in: All feature components
- Connections: CardHeader, CardTitle, CardContent, CardDescription

#### Badge (`src/components/ui/badge.tsx`)
- Status and category badges
- Used in: Tables, status indicators
- Connections: All components for status display

#### Avatar (`src/components/ui/avatar.tsx`)
- User profile images
- Used in: Topbar, MemberManagement, StaffManagement
- Connections: User profile displays

#### Table (`src/components/ui/table.tsx`)
- Data table component
- Used in: MemberManagement, ClassBooking, StaffManagement, PaymentSystem
- Connections: TableHeader, TableBody, TableRow, TableCell

---

### Interactive Components

#### Button (`src/components/ui/button.tsx`)
- Action buttons
- Used in: All components
- Variants: default, outline, ghost, destructive
- Connections: All interactive elements

#### Dialog (`src/components/ui/dialog.tsx`)
- Modal dialogs
- Used in: All forms, confirmations
- Connections: DialogTrigger, DialogContent, DialogHeader

#### DropdownMenu (`src/components/ui/dropdown-menu.tsx`)
- Dropdown menus
- Used in: Topbar (user menu, notifications)
- Connections: Menu items, actions

#### Tabs (`src/components/ui/tabs.tsx`)
- Tab navigation
- Used in: PaymentSystem, AnalyticsDashboard
- Connections: TabsList, TabsTrigger, TabsContent

---

### Feedback Components

#### Toast (`src/components/ui/toast.tsx`)
- Notification toasts
- Used in: Success/error messages
- Connections: Sonner toast system

#### Skeleton (`src/components/ui/skeleton.tsx`)
- Loading placeholders
- Used in: Data loading states
- Connections: All data-fetching components

---

## Component Usage Patterns

### Form Pattern
```tsx
<Dialog>
  <DialogTrigger>Open Form</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <form>
      <Label>Field</Label>
      <Input />
      <Button type="submit">Submit</Button>
    </form>
  </DialogContent>
</Dialog>
```

### Table Pattern
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Column</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Data</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

### Stat Card Pattern
```tsx
<Card>
  <CardHeader>
    <CardTitle>Metric</CardTitle>
    <Icon />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">Value</div>
  </CardContent>
</Card>
```

---

## Styling System

### Color Palette
- **Primary:** Blue/Violet gradient (`from-violet-600 to-blue-600`)
- **Accent:** Blue (`217 91% 60%`)
- **No:** Green, Orange, Red, Yellow

### Design Tokens
- **Border Radius:** 16-20px (rounded-2xl)
- **Shadows:** Soft shadows with glassmorphism
- **Spacing:** Large, breathable (gap-6, p-6)
- **Typography:** Modern, clean fonts

### Glassmorphism
- `bg-white/60 backdrop-blur-xl`
- `border border-white/20`
- `shadow-lg shadow-black/5`

---

## Component Dependencies

```
UI Components
├── Radix UI Primitives
├── Tailwind CSS
├── Framer Motion (for animations)
└── Lucide Icons
```

## Customization

All UI components can be customized via:
- Tailwind classes
- CSS variables (in `index.css`)
- Component props
- Variant system (CVA - class-variance-authority)

