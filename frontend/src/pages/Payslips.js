import React, { useState, useEffect } from 'react';
import PayslipViewer from '../components/Payslip/PayslipViewer';
import axios from 'axios';
import './Payslips.css';

const Payslips = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserAndEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        
        // Check if user is admin or HR
        const adminRoles = ['admin', 'hr'];
        const userIsAdmin = adminRoles.includes(userInfo.role?.toLowerCase());
        setIsAdmin(userIsAdmin);

        if (userIsAdmin) {
          // Fetch all employees for admin/HR
          const response = await axios.get('http://localhost:5000/api/employees', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setEmployees(response.data.employees || []);
        } else {
          // For regular employees, find their employee record
          if (userInfo.email) {
            const response = await axios.get(
              `http://localhost:5000/api/employees?search=${userInfo.email}`,
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );
            const userEmployee = response.data.employees?.find(emp => 
              emp.email.toLowerCase() === userInfo.email.toLowerCase()
            );
            
            if (userEmployee) {
              setSelectedEmployeeId(userEmployee.id);
              setEmployees([userEmployee]);
            } else {
              setError('Employee record not found. Please contact HR.');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user information');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndEmployees();
  }, []);

  const handleEmployeeChange = (employeeId) => {
    setSelectedEmployeeId(employeeId);
  };

  if (loading) {
    return (
      <div className="payslips-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading payslip information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payslips-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payslips-page">
      <div className="payslips-header">
        <h1>Employee Payslips</h1>
        <p>View and download employee payslips with detailed salary breakdown</p>
      </div>

      {isAdmin && (
        <div className="employee-selector-section">
          <div className="selector-container">
            <label htmlFor="employee-select">Select Employee:</label>
            <select
              id="employee-select"
              value={selectedEmployeeId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="employee-select"
            >
              <option value="">-- Select an Employee --</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.employee_number} - {employee.first_name} {employee.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {!isAdmin && employees.length > 0 && (
        <div className="current-employee-info">
          <h2>Your Payslips</h2>
          <p>
            Employee: {employees[0].first_name} {employees[0].last_name} 
            ({employees[0].employee_number})
          </p>
        </div>
      )}

      <div className="payslip-viewer-section">
        <PayslipViewer employeeId={selectedEmployeeId} />
      </div>
    </div>
  );
};

export default Payslips;