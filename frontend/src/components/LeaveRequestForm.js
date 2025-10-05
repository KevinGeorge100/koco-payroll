import React, { useState, useEffect } from 'react';
import { Calendar, Send, AlertCircle, Clock } from 'lucide-react';
import employeeService from '../services/employeeService';
import leaveService from '../services/leaveService';

const LeaveRequestForm = ({ onSubmitSuccess, employeeId = null }) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: employeeId || '',
    start_date: '',
    end_date: '',
    leave_type: '',
    reason: ''
  });
  const [errors, setErrors] = useState({});
  const [calculatedDays, setCalculatedDays] = useState(0);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const days = leaveService.calculateDays(formData.start_date, formData.end_date);
      setCalculatedDays(days);
    } else {
      setCalculatedDays(0);
    }
  }, [formData.start_date, formData.end_date]);

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getEmployees();
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const validationErrors = leaveService.validateLeaveRequest(formData);
    const errorObj = {};
    
    validationErrors.forEach(error => {
      if (error.includes('Employee')) errorObj.employee_id = error;
      if (error.includes('Start date')) errorObj.start_date = error;
      if (error.includes('End date')) errorObj.end_date = error;
      if (error.includes('Leave type')) errorObj.leave_type = error;
      if (error.includes('Reason')) errorObj.reason = error;
    });

    setErrors(errorObj);
    return Object.keys(errorObj).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await leaveService.submitLeaveRequest(formData);
      
      // Reset form
      setFormData({
        employee_id: employeeId || '',
        start_date: '',
        end_date: '',
        leave_type: '',
        reason: ''
      });
      
      setCalculatedDays(0);
      setErrors({});
      
      if (onSubmitSuccess) {
        onSubmitSuccess(response.data);
      }
      
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const leaveTypes = leaveService.getLeaveTypes();

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Submit Leave Request</h3>
        </div>
      </div>
      
      <div className="card-body">
        {errors.submit && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!employeeId && (
            <div>
              <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700 mb-1">
                Employee *
              </label>
              <select
                id="employee_id"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleInputChange}
                className={`form-input ${errors.employee_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                required
              >
                <option value="">Select Employee</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name} ({employee.employee_id})
                  </option>
                ))}
              </select>
              {errors.employee_id && (
                <p className="mt-1 text-sm text-red-600">{errors.employee_id}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className={`form-input ${errors.start_date ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                required
              />
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
              )}
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                min={formData.start_date || new Date().toISOString().split('T')[0]}
                className={`form-input ${errors.end_date ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                required
              />
              {errors.end_date && (
                <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
              )}
            </div>
          </div>

          {calculatedDays > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm text-blue-700">
                  Duration: <strong>{calculatedDays} day{calculatedDays !== 1 ? 's' : ''}</strong>
                </span>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="leave_type" className="block text-sm font-medium text-gray-700 mb-1">
              Leave Type *
            </label>
            <select
              id="leave_type"
              name="leave_type"
              value={formData.leave_type}
              onChange={handleInputChange}
              className={`form-input ${errors.leave_type ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              required
            >
              <option value="">Select Leave Type</option>
              {leaveTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.leave_type && (
              <p className="mt-1 text-sm text-red-600">{errors.leave_type}</p>
            )}
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason *
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              rows={4}
              placeholder="Please provide a detailed reason for your leave request..."
              className={`form-input ${errors.reason ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              required
              minLength={10}
              maxLength={1000}
            />
            <div className="mt-1 flex justify-between">
              {errors.reason ? (
                <p className="text-sm text-red-600">{errors.reason}</p>
              ) : (
                <p className="text-sm text-gray-500">Minimum 10 characters required</p>
              )}
              <p className="text-sm text-gray-400">
                {formData.reason.length}/1000
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Leave Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveRequestForm;