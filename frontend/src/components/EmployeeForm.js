import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';

const EmployeeForm = ({ employee, onSave, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    hireDate: '',
    departmentId: '',
    positionId: '',
    salary: '',
    address: '',
    employeeNumber: ''
  });

  const [errors, setErrors] = useState({});

  // Mock data for departments and positions (in a real app, these would come from API)
  const departments = [
    { id: '1', name: 'Engineering' },
    { id: '2', name: 'Sales' },
    { id: '3', name: 'Marketing' },
    { id: '4', name: 'Human Resources' },
    { id: '5', name: 'Finance' },
    { id: '6', name: 'Operations' }
  ];

  const positions = [
    { id: '1', title: 'Software Engineer' },
    { id: '2', title: 'Senior Software Engineer' },
    { id: '3', title: 'Sales Representative' },
    { id: '4', title: 'Sales Manager' },
    { id: '5', title: 'Marketing Coordinator' },
    { id: '6', title: 'Marketing Manager' },
    { id: '7', title: 'HR Specialist' },
    { id: '8', title: 'HR Manager' },
    { id: '9', title: 'Financial Analyst' },
    { id: '10', title: 'Accountant' }
  ];

  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.first_name || '',
        lastName: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        dateOfBirth: employee.date_of_birth || '',
        hireDate: employee.hire_date || '',
        departmentId: employee.department_id || '',
        positionId: employee.position_id || '',
        salary: employee.salary || '',
        address: employee.address || '',
        employeeNumber: employee.employee_number || ''
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.hireDate) {
      newErrors.hireDate = 'Hire date is required';
    }

    if (!formData.salary || parseFloat(formData.salary) <= 0) {
      newErrors.salary = 'Valid salary is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold text-gray-900">
          {employee ? 'Edit Employee' : 'Add New Employee'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="card-body space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`form-input ${errors.firstName ? 'border-red-500' : ''}`}
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="form-label">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`form-input ${errors.lastName ? 'border-red-500' : ''}`}
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label className="form-label">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="form-label">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Employee Number</label>
              <input
                type="text"
                name="employeeNumber"
                value={formData.employeeNumber}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter employee number"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="form-label">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              className="form-input"
              placeholder="Enter full address"
            />
          </div>
        </div>

        {/* Employment Information */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Employment Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                Hire Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="hireDate"
                value={formData.hireDate}
                onChange={handleChange}
                className={`form-input ${errors.hireDate ? 'border-red-500' : ''}`}
              />
              {errors.hireDate && (
                <p className="mt-1 text-sm text-red-600">{errors.hireDate}</p>
              )}
            </div>

            <div>
              <label className="form-label">Department</label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Position</label>
              <select
                name="positionId"
                value={formData.positionId}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Select Position</option>
                {positions.map(position => (
                  <option key={position.id} value={position.id}>
                    {position.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">
                Base Salary <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  className={`form-input pl-8 ${errors.salary ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.salary && (
                <p className="mt-1 text-sm text-red-600">{errors.salary}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Employee'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;