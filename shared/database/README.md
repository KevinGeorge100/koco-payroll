# KOCO Payroll Database Setup Guide

This directory contains the database schema and configuration files for the KOCO Payroll Management System using Supabase.

## Files

- `schema.sql` - Complete database schema with tables, indexes, and triggers
- `policies.sql` - Row Level Security (RLS) policies for data access control
- `sample_data.sql` - Sample data for testing and development

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Create a new project
4. Note down your project URL and API keys

### 2. Run Database Schema

1. Open the Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Run the query to create all tables and functions

### 3. Set Up Row Level Security

1. In the SQL Editor, copy and paste the contents of `policies.sql`
2. Run the query to create all RLS policies

### 4. Insert Sample Data (Optional)

1. Copy and paste the contents of `sample_data.sql`
2. Run the query to insert sample departments, positions, and other reference data

### 5. Configure Environment Variables

Update your environment files with the Supabase credentials:

#### Backend (.env)
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Frontend (.env)
```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

## Database Schema Overview

### Core Tables

- **user_profiles** - Extends auth.users with role information
- **departments** - Company departments
- **positions** - Job positions within departments
- **employees** - Employee records with personal and employment details
- **timesheets** - Time tracking and approval workflow
- **payroll_records** - Payroll calculations and payment tracking

### Supporting Tables

- **projects** - Projects for time tracking
- **benefits** - Company benefits catalog
- **employee_benefits** - Employee benefit enrollments
- **tax_rates** - Tax calculation rates
- **audit_logs** - System audit trail

### Security

The database uses Row Level Security (RLS) to ensure:
- Employees can only access their own data
- HR users can manage employee-related data
- Admins have full system access
- All data access is logged for audit purposes

### User Roles

- **admin** - Full system access
- **hr** - Employee and payroll management
- **employee** - Limited access to own data

## API Integration

The backend Express server connects to Supabase using:
- Service role key for administrative operations
- Anon key for user authentication and authorized data access
- JWT tokens for user session management

## Development Tips

1. Use the Supabase dashboard to view and edit data during development
2. Monitor the logs in Supabase for debugging database queries
3. Test RLS policies by switching between different user roles
4. Use the `generate_sample_timesheets()` function to create test timesheet data

## Production Considerations

1. Backup your database regularly
2. Monitor query performance and add indexes as needed
3. Review and update RLS policies as requirements change
4. Implement proper error handling for database operations
5. Consider implementing database migrations for schema changes