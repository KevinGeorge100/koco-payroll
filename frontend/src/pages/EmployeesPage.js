import React, { useState } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import EmployeeList from '../components/EmployeeList';
import EmployeeForm from '../components/EmployeeForm';
import { employeeService } from '../services/employeeService';

const EmployeesPage = () => {
  const navigate = useNavigate();

  const handleAddEmployee = () => {
    navigate('/employees/new');
  };

  const handleEditEmployee = (employee) => {
    navigate(`/employees/${employee.id}/edit`);
  };

  const handleViewEmployee = (employee) => {
    navigate(`/employees/${employee.id}`);
  };

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <EmployeeList 
            onAddEmployee={handleAddEmployee}
            onEditEmployee={handleEditEmployee}
            onViewEmployee={handleViewEmployee}
          />
        } 
      />
      <Route path="/new" element={<AddEmployeePage />} />
      <Route path="/:id/edit" element={<EditEmployeePage />} />
      <Route path="/:id" element={<ViewEmployeePage />} />
    </Routes>
  );
};

// Add Employee Page Component
const AddEmployeePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (employeeData) => {
    try {
      setIsLoading(true);
      setError(null);
      await employeeService.createEmployee(employeeData);
      navigate('/employees');
    } catch (err) {
      setError('Failed to create employee. Please try again.');
      console.error('Error creating employee:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/employees');
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      <EmployeeForm 
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
};

// Edit Employee Page Component
const EditEmployeePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const response = await employeeService.getEmployee(id);
        setEmployee(response.employee);
      } catch (err) {
        setError('Failed to fetch employee data.');
        console.error('Error fetching employee:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmployee();
    }
  }, [id]);

  const handleSave = async (employeeData) => {
    try {
      setIsLoading(true);
      setError(null);
      await employeeService.updateEmployee(id, employeeData);
      navigate('/employees');
    } catch (err) {
      setError('Failed to update employee. Please try again.');
      console.error('Error updating employee:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/employees');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Employee not found.</p>
        <button 
          onClick={() => navigate('/employees')}
          className="mt-4 btn btn-primary"
        >
          Back to Employees
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      <EmployeeForm 
        employee={employee}
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
};

// View Employee Page Component (placeholder for future implementation)
const ViewEmployeePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const response = await employeeService.getEmployee(id);
        setEmployee(response.employee);
      } catch (err) {
        setError('Failed to fetch employee data.');
        console.error('Error fetching employee:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmployee();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Employee not found.</p>
        <button 
          onClick={() => navigate('/employees')}
          className="mt-4 btn btn-primary"
        >
          Back to Employees
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {employee.first_name} {employee.last_name}
        </h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate(`/employees/${id}/edit`)}
            className="btn btn-secondary"
          >
            Edit
          </button>
          <button 
            onClick={() => navigate('/employees')}
            className="btn btn-primary"
          >
            Back to List
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Employee Details</h2>
        </div>
        <div className="card-body">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {employee.first_name} {employee.last_name}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{employee.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{employee.phone || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Employee Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{employee.employee_number || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Department</dt>
              <dd className="mt-1 text-sm text-gray-900">{employee.departments?.name || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Position</dt>
              <dd className="mt-1 text-sm text-gray-900">{employee.positions?.title || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Hire Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Salary</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {employee.salary ? new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(employee.salary) : 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  employee.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : employee.status === 'inactive'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {employee.status || 'active'}
                </span>
              </dd>
            </div>
            {employee.address && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{employee.address}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;