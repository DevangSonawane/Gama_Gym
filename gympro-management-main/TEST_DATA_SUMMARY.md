# Test Data Summary

## ✅ Test Data Successfully Added

### Data Counts:
- **Members**: 5 records
- **Staff**: 6 records  
- **Classes**: 12 records
- **Class Schedules**: 11 records
- **Payments**: 11 records
- **Promo Codes**: 6 records
- **Invoices**: 4 records

## Test Data Details

### Members (5 records)
- John Doe - Gym + Cardio membership
- Sarah Smith - Gym membership
- Mike Johnson - Full Package membership
- Aditya Borhade - Full Package membership
- (Plus existing members)

### Staff (6 records)
- Sarah Wilson - Yoga Instructor (TRAINER)
- Mike Johnson - Fitness Trainer (TRAINER)
- Lisa Davis - Strength Coach (TRAINER)
- Tom Brown - Front Desk Associate (STAFF)
- Emily Martinez - Gym Manager (MANAGER)
- (Plus existing staff)

### Classes (12 records)
- Morning Yoga - Beginner, $15
- HIIT Training - Advanced, $20
- Strength Training - Intermediate, $25
- Pilates Core - Beginner, $18
- Cardio Blast - Intermediate, $20
- Powerlifting - Advanced, $30
- (Plus existing classes)

### Class Schedules (11 records)
- Various scheduled classes with different dates, times, and rooms
- Includes booked counts and waitlist counts
- Status: 'scheduled'

### Payments (11 records)
- Multiple payment types: MEMBERSHIP, CLASS
- Payment methods: STRIPE, PAYPAL
- Statuses: COMPLETED, PENDING, FAILED, OVERDUE
- Various amounts and dates

### Promo Codes (6 records)
- NEWYEAR2024 - 20% off (percentage)
- FIRST10 - $10 off (fixed)
- SUMMER25 - 25% off (percentage)
- WELCOME50 - $50 off (fixed)
- (Plus existing codes)

### Invoices (4 records)
- Various invoice statuses: paid, sent, overdue
- Linked to payments and members
- Different amounts and dates

## How to Verify

1. **Members Page**: Should show 5 members with different membership types
2. **Staff Page**: Should show 6 staff members with different roles
3. **Classes Page**: Should show 12 classes with schedules
4. **Payments Page**: Should show 11 payments with different statuses
5. **Analytics**: Should calculate stats from all this data

## Next Steps

All test data is now in Supabase. You can:
- View the data in each component
- Test CRUD operations (Create, Read, Update, Delete)
- Verify that data persists after page refresh
- Test filtering and search functionality

