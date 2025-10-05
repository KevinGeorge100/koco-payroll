import { supabase } from '../lib/supabase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class LeaveService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/leaves`;
  }

  // Helper method to get auth headers
  async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`
    };
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Get all leave requests with filtering and pagination
  async getLeaveRequests(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const url = queryParams.toString() 
        ? `${this.baseURL}?${queryParams}`
        : this.baseURL;

      const response = await fetch(url, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      throw error;
    }
  }

  // Get specific leave request by ID
  async getLeaveRequest(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching leave request:', error);
      throw error;
    }
  }

  // Submit new leave request
  async submitLeaveRequest(leaveData) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(leaveData)
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error submitting leave request:', error);
      throw error;
    }
  }

  // Approve leave request
  async approveLeaveRequest(id, adminNotes = '') {
    try {
      const response = await fetch(`${this.baseURL}/${id}/approve`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ admin_notes: adminNotes })
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error approving leave request:', error);
      throw error;
    }
  }

  // Reject leave request
  async rejectLeaveRequest(id, adminNotes) {
    try {
      const response = await fetch(`${this.baseURL}/${id}/reject`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ admin_notes: adminNotes })
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      throw error;
    }
  }

  // Delete leave request
  async deleteLeaveRequest(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders()
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting leave request:', error);
      throw error;
    }
  }

  // Get leave requests for specific employee
  async getEmployeeLeaveRequests(employeeId, filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const url = queryParams.toString() 
        ? `${this.baseURL}/employee/${employeeId}?${queryParams}`
        : `${this.baseURL}/employee/${employeeId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching employee leave requests:', error);
      throw error;
    }
  }

  // Get leave summary statistics
  async getLeaveSummary() {
    try {
      const response = await fetch(`${this.baseURL}/summary/stats`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching leave summary:', error);
      throw error;
    }
  }

  // Utility methods
  formatDate(date) {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  }

  formatDisplayDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  calculateDays(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  getStatusColor(status) {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getLeaveTypeColor(leaveType) {
    switch (leaveType) {
      case 'Annual':
        return 'bg-blue-100 text-blue-800';
      case 'Sick':
        return 'bg-red-100 text-red-800';
      case 'Personal':
        return 'bg-purple-100 text-purple-800';
      case 'Emergency':
        return 'bg-orange-100 text-orange-800';
      case 'Maternity':
      case 'Paternity':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Validation methods
  validateLeaveRequest(leaveData) {
    const errors = [];

    if (!leaveData.employee_id) {
      errors.push('Employee is required');
    }

    if (!leaveData.start_date) {
      errors.push('Start date is required');
    }

    if (!leaveData.end_date) {
      errors.push('End date is required');
    }

    if (leaveData.start_date && leaveData.end_date) {
      const startDate = new Date(leaveData.start_date);
      const endDate = new Date(leaveData.end_date);
      
      if (endDate < startDate) {
        errors.push('End date must be after or equal to start date');
      }

      // Check if start date is not too far in the past
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      if (startDate < thirtyDaysAgo) {
        errors.push('Start date cannot be more than 30 days in the past');
      }
    }

    if (!leaveData.leave_type) {
      errors.push('Leave type is required');
    }

    if (!leaveData.reason || leaveData.reason.trim().length < 10) {
      errors.push('Reason must be at least 10 characters long');
    }

    if (leaveData.reason && leaveData.reason.length > 1000) {
      errors.push('Reason cannot exceed 1000 characters');
    }

    return errors;
  }

  // Get available leave types
  getLeaveTypes() {
    return [
      { value: 'Annual', label: 'Annual Leave' },
      { value: 'Sick', label: 'Sick Leave' },
      { value: 'Personal', label: 'Personal Leave' },
      { value: 'Emergency', label: 'Emergency Leave' },
      { value: 'Maternity', label: 'Maternity Leave' },
      { value: 'Paternity', label: 'Paternity Leave' },
      { value: 'Other', label: 'Other' }
    ];
  }

  // Get available status options
  getStatusOptions() {
    return [
      { value: 'Pending', label: 'Pending' },
      { value: 'Approved', label: 'Approved' },
      { value: 'Rejected', label: 'Rejected' }
    ];
  }
}

const leaveService = new LeaveService();
export default leaveService;