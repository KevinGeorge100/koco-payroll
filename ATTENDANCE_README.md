# Attendance Module

This module provides comprehensive attendance tracking functionality for the KOCO Payroll system.

## Features

- **Calendar View**: Mark daily attendance with a visual calendar interface
- **History View**: Browse attendance records with filtering and pagination
- **Status Options**: Present, Absent, Leave, Half Day, Late
- **Time Tracking**: Optional check-in and check-out times
- **Role-based Access**: HR and Admin can mark attendance, all authenticated users can view

## Setup Instructions

### 1. Database Setup
Run the SQL script to create the attendance table:
```sql
-- Copy and paste the contents of attendance-table-setup.sql into your Supabase SQL editor
```

### 2. Backend Integration
The attendance API routes are already integrated into the backend at:
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Create attendance record
- `PUT /api/attendance/:id` - Update attendance record  
- `DELETE /api/attendance/:id` - Delete attendance record
- `POST /api/attendance/bulk` - Bulk create/update attendance

### 3. Frontend Navigation
The attendance module is accessible through:
- Main navigation: "Attendance"
- Calendar tab: Mark daily attendance
- History tab: View attendance records

## Usage

### Marking Attendance
1. Go to Attendance > Calendar
2. Click on any date in the calendar
3. Select employees and their attendance status
4. Optionally add check-in/out times and notes
5. Save the attendance records

### Viewing History
1. Go to Attendance > History
2. Use filters to narrow down records:
   - Employee selection
   - Date range
   - Status filter
3. Records are paginated for better performance

## API Endpoints

- `GET /api/attendance?page=1&limit=10` - Paginated attendance records
- `GET /api/attendance/employee/:employeeId` - Employee's attendance history
- `GET /api/attendance/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Attendance summary
- `POST /api/attendance` - Mark attendance for an employee
- `POST /api/attendance/bulk` - Mark attendance for multiple employees

## Security

- Row Level Security (RLS) is enabled
- Only HR and Admin roles can create/modify attendance records
- All authenticated users can view attendance records
- Proper data validation and sanitization

## Database Schema

```sql
attendance {
  id: UUID (PK)
  employee_id: UUID (FK to employees)
  date: DATE
  status: VARCHAR (Present/Absent/Leave/Half Day/Late)
  check_in_time: TIME (optional)
  check_out_time: TIME (optional)
  notes: TEXT (optional)
  marked_by: UUID (FK to auth.users)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

## Component Structure

- `AttendancePage.js` - Main page with tab navigation
- `AttendanceCalendar.js` - Calendar interface for marking attendance
- `AttendanceHistory.js` - Table view for browsing records
- `attendanceService.js` - API service layer