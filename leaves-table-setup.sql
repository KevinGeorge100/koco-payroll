-- Create leaves table for leave request management
CREATE TABLE IF NOT EXISTS public.leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('Annual', 'Sick', 'Personal', 'Emergency', 'Maternity', 'Paternity', 'Other')),
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    days_requested INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_future_dates CHECK (start_date >= CURRENT_DATE - INTERVAL '30 days')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leaves_employee_id ON public.leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON public.leaves(status);
CREATE INDEX IF NOT EXISTS idx_leaves_start_date ON public.leaves(start_date);
CREATE INDEX IF NOT EXISTS idx_leaves_end_date ON public.leaves(end_date);
CREATE INDEX IF NOT EXISTS idx_leaves_leave_type ON public.leaves(leave_type);
CREATE INDEX IF NOT EXISTS idx_leaves_submitted_at ON public.leaves(submitted_at);
CREATE INDEX IF NOT EXISTS idx_leaves_employee_status ON public.leaves(employee_id, status);

-- Enable RLS (Row Level Security)
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leaves table (simplified for initial setup)
-- All authenticated users can view leave requests
CREATE POLICY "Authenticated users can view leave requests" ON public.leaves
    FOR SELECT USING (auth.role() = 'authenticated');

-- Employees can view their own leave requests
CREATE POLICY "Employees can view own leave requests" ON public.leaves
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM public.employees 
            WHERE user_id = auth.uid()
        )
    );

-- Employees can insert their own leave requests
CREATE POLICY "Employees can submit leave requests" ON public.leaves
    FOR INSERT WITH CHECK (
        employee_id IN (
            SELECT id FROM public.employees 
            WHERE user_id = auth.uid()
        )
    );

-- Authenticated users can update leave requests (for now - can be restricted later)
CREATE POLICY "Authenticated users can update leave requests" ON public.leaves
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Authenticated users can delete leave requests (for now - can be restricted later)
CREATE POLICY "Authenticated users can delete leave requests" ON public.leaves
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leaves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    
    -- If status is being changed to Approved or Rejected, set reviewed_at
    IF OLD.status = 'Pending' AND NEW.status IN ('Approved', 'Rejected') THEN
        NEW.reviewed_at = TIMEZONE('utc'::text, NOW());
        NEW.reviewed_by = auth.uid();
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for leaves table
CREATE TRIGGER update_leaves_updated_at 
    BEFORE UPDATE ON public.leaves 
    FOR EACH ROW EXECUTE FUNCTION update_leaves_updated_at();

-- Function to automatically create attendance records when leave is approved
CREATE OR REPLACE FUNCTION create_attendance_for_approved_leave()
RETURNS TRIGGER AS $$
DECLARE
    loop_date DATE;
BEGIN
    -- Only proceed if leave was approved
    IF NEW.status = 'Approved' AND OLD.status = 'Pending' THEN
        -- Loop through each date in the leave period
        loop_date := NEW.start_date;
        WHILE loop_date <= NEW.end_date LOOP
            -- Insert attendance record for each day (only on weekdays)
            IF EXTRACT(DOW FROM loop_date) NOT IN (0, 6) THEN -- 0=Sunday, 6=Saturday
                INSERT INTO public.attendance (
                    employee_id, 
                    date, 
                    status, 
                    notes,
                    marked_by
                ) VALUES (
                    NEW.employee_id,
                    loop_date,
                    'Leave',
                    'Auto-generated from approved leave request: ' || NEW.reason,
                    NEW.reviewed_by
                )
                ON CONFLICT (employee_id, date) DO UPDATE SET
                    status = 'Leave',
                    notes = 'Auto-updated from approved leave request: ' || NEW.reason,
                    updated_at = TIMEZONE('utc'::text, NOW());
            END IF;
            loop_date := loop_date + INTERVAL '1 day';
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-create attendance when leave is approved
CREATE TRIGGER create_attendance_on_leave_approval
    AFTER UPDATE ON public.leaves
    FOR EACH ROW EXECUTE FUNCTION create_attendance_for_approved_leave();

-- Insert some sample leave requests for testing (optional)
-- This will only work if you have employees in your database
INSERT INTO public.leaves (employee_id, start_date, end_date, leave_type, reason, status)
SELECT 
    e.id,
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '9 days',
    'Annual',
    'Family vacation',
    'Pending'
FROM public.employees e
LIMIT 2
ON CONFLICT DO NOTHING;