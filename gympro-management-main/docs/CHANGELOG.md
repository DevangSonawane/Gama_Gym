# Changelog

## Recent Updates

### Collapsible Sidebar
- **Added:** Toggle button to collapse/expand sidebar
- **Features:**
  - Collapsed state: 80px width, icon-only navigation
  - Expanded state: 256px width, full labels visible
  - State persistence in localStorage
  - Smooth animations for width and content transitions
  - Tooltips show labels when collapsed
  - Main content margin adjusts automatically

### Member Management Enhancements
- **Added:** View member details dialog
  - Shows complete member information
  - Contact details, membership info, emergency contact
  - Fitness goals and medical conditions
- **Added:** Edit member functionality
  - Pre-filled form with existing member data
  - Update all member fields
  - Status toggle (Active/Inactive)
- **Added:** Delete member functionality
  - Confirmation dialog before deletion
  - Role-based access (Staff role required)

### Staff Management Enhancements
- **Added:** Edit staff functionality
  - Pre-filled form with existing staff data
  - Update position, department, salary, role
  - Role-based access (Manager role required)
- **Added:** Delete staff functionality
  - Confirmation dialog before deletion
  - Role-based access (Manager role required)

### UI Improvements
- **Updated:** Color palette to blue-only theme
  - Removed all green, orange, red, and yellow colors
  - Replaced with blue, cyan, indigo, violet variants
  - Consistent blue theme throughout application
- **Updated:** Hover states use blue accent color
- **Fixed:** Toggle button positioning when sidebar collapsed
- **Fixed:** Toggle button hover shift issue

## Component Updates

### Sidebar Component
- Added `isCollapsed` prop support
- Added `onToggle` callback prop
- Internal state management with localStorage
- Conditional rendering for collapsed/expanded states
- Improved toggle button positioning

### MemberManagement Component
- Added `ViewMemberDialog` component
- Added `EditMemberForm` component
- Added `handleUpdateMember` function
- Added `handleDeleteMember` function
- Enhanced action buttons (View, Edit, Delete)

### StaffManagement Component
- Added `EditStaffForm` component
- Added `handleUpdateStaff` function
- Added `handleDeleteStaff` function
- Enhanced action buttons (View, Edit, Delete)

## Breaking Changes
None - All changes are backward compatible.

## Migration Notes
- Sidebar collapse state is automatically saved to localStorage
- No migration needed for existing users
- All new features are opt-in via UI interactions


