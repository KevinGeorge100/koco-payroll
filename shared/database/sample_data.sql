-- Sample data for KOCO Payroll System
-- This file contains sample data to help you get started

-- Insert sample departments
INSERT INTO departments (id, name, description) VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Engineering', 'Software development and technical operations'),
    ('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'Human Resources', 'Employee relations and talent management'),
    ('c3d4e5f6-g7h8-9012-cdef-345678901234', 'Finance', 'Financial planning and accounting'),
    ('d4e5f6g7-h8i9-0123-defg-456789012345', 'Marketing', 'Brand management and customer acquisition'),
    ('e5f6g7h8-i9j0-1234-efgh-567890123456', 'Operations', 'Business operations and logistics');

-- Insert sample positions
INSERT INTO positions (id, title, department_id, description, min_salary, max_salary) VALUES
    ('f6g7h8i9-j0k1-2345-fghi-678901234567', 'Software Engineer', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Full-stack software development', 70000, 120000),
    ('g7h8i9j0-k1l2-3456-ghij-789012345678', 'Senior Software Engineer', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Senior-level software development and mentoring', 100000, 160000),
    ('h8i9j0k1-l2m3-4567-hijk-890123456789', 'HR Manager', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', 'Human resources management and strategy', 75000, 110000),
    ('i9j0k1l2-m3n4-5678-ijkl-901234567890', 'Accountant', 'c3d4e5f6-g7h8-9012-cdef-345678901234', 'Financial record keeping and analysis', 50000, 75000),
    ('j0k1l2m3-n4o5-6789-jklm-012345678901', 'Marketing Specialist', 'd4e5f6g7-h8i9-0123-defg-456789012345', 'Digital marketing and content creation', 45000, 70000);

-- Insert sample projects
INSERT INTO projects (id, name, description, client, start_date, end_date, is_active) VALUES
    ('k1l2m3n4-o5p6-7890-klmn-123456789012', 'Website Redesign', 'Complete redesign of company website', 'Internal', '2024-01-01', '2024-06-30', true),
    ('l2m3n4o5-p6q7-8901-lmno-234567890123', 'Mobile App Development', 'Development of customer mobile application', 'ACME Corp', '2024-02-15', '2024-08-15', true),
    ('m3n4o5p6-q7r8-9012-mnop-345678901234', 'Data Migration', 'Migration of legacy data to new system', 'TechStart Inc', '2024-03-01', '2024-05-31', true);

-- Insert sample benefits
INSERT INTO benefits (id, name, description, type, employer_contribution_percent, employee_contribution_percent, max_contribution) VALUES
    ('n4o5p6q7-r8s9-0123-nopq-456789012345', 'Health Insurance', 'Comprehensive health insurance coverage', 'health', 80.00, 20.00, 1000.00),
    ('o5p6q7r8-s9t0-1234-opqr-567890123456', 'Dental Insurance', 'Dental care coverage', 'dental', 100.00, 0.00, 500.00),
    ('p6q7r8s9-t0u1-2345-pqrs-678901234567', '401k Retirement Plan', 'Company-matched retirement savings', 'retirement', 50.00, 0.00, 6000.00),
    ('q7r8s9t0-u1v2-3456-qrst-789012345678', 'Vision Insurance', 'Eye care coverage', 'vision', 100.00, 0.00, 300.00);

-- Insert sample tax rates (2024)
INSERT INTO tax_rates (year, state, tax_type, rate, min_income, max_income) VALUES
    (2024, NULL, 'federal_income_10', 0.10, 0, 11000),
    (2024, NULL, 'federal_income_12', 0.12, 11000, 44725),
    (2024, NULL, 'federal_income_22', 0.22, 44725, 95375),
    (2024, NULL, 'federal_income_24', 0.24, 95375, 182050),
    (2024, NULL, 'social_security', 0.062, 0, 160200),
    (2024, NULL, 'medicare', 0.0145, 0, NULL),
    (2024, 'CA', 'state_income', 0.01, 0, 10099),
    (2024, 'CA', 'state_income', 0.02, 10099, 23942),
    (2024, 'CA', 'state_income', 0.04, 23942, 37788);

-- Note: To insert sample employees, you would need actual user IDs from Supabase Auth
-- This would typically be done after users register through the application
-- Here's an example of what the INSERT would look like:

/*
-- Sample employees (replace UUIDs with actual auth.users IDs)
INSERT INTO employees (
    user_id, employee_number, first_name, last_name, email, phone, 
    hire_date, department_id, position_id, salary, status
) VALUES
    (
        'actual-user-uuid-1', 'EMP001', 'John', 'Doe', 'john.doe@company.com', 
        '+1-555-0101', '2024-01-15', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
        'f6g7h8i9-j0k1-2345-fghi-678901234567', 85000, 'active'
    ),
    (
        'actual-user-uuid-2', 'EMP002', 'Jane', 'Smith', 'jane.smith@company.com', 
        '+1-555-0102', '2024-02-01', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', 
        'h8i9j0k1-l2m3-4567-hijk-890123456789', 95000, 'active'
    );
*/

-- Create a function to generate sample timesheet data
CREATE OR REPLACE FUNCTION generate_sample_timesheets(
    emp_id UUID,
    start_date DATE,
    end_date DATE
)
RETURNS VOID AS $$
DECLARE
    current_date DATE := start_date;
    work_hours DECIMAL(4,2);
BEGIN
    WHILE current_date <= end_date LOOP
        -- Skip weekends
        IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
            -- Generate random work hours between 7-9 hours
            work_hours := 7 + (RANDOM() * 2);
            
            INSERT INTO timesheets (
                employee_id,
                date,
                clock_in,
                clock_out,
                break_duration,
                hours_worked,
                status
            ) VALUES (
                emp_id,
                current_date,
                current_date + INTERVAL '9 hours',
                current_date + INTERVAL '9 hours' + (work_hours || ' hours')::INTERVAL,
                30, -- 30 minute break
                work_hours - 0.5, -- Subtract break time
                CASE 
                    WHEN current_date < CURRENT_DATE - INTERVAL '1 week' THEN 'approved'
                    WHEN current_date < CURRENT_DATE THEN 'submitted'
                    ELSE 'draft'
                END
            );
        END IF;
        
        current_date := current_date + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql;