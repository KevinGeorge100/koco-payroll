import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  User
} from 'lucide-react';
import leaveService from '../services/leaveService';
import employeeService from '../services/employeeService';

const LeaveManagementDashboard = () => {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    employee_id: '',
    leave_type: '',
    search: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionModal, setActionModal] = useState({ show: false, type: '', leave: null });
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getEmployees();
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const response = await leaveService.getLeaveRequests(filters);
      setLeaves(response.data || []);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const openActionModal = (type, leave) => {
    setActionModal({ show: true, type, leave });
    setAdminNotes('');
  };

  const closeActionModal = () => {
    setActionModal({ show: false, type: '', leave: null });
    setAdminNotes('');
  };

  const handleApprove = async (leaveId, notes = '') => {
    setActionLoading(prev => ({ ...prev, [leaveId]: true }));
    try {
      await leaveService.approveLeaveRequest(leaveId, notes);
      fetchLeaves();
      closeActionModal();
    } catch (error) {
      console.error('Error approving leave:', error);
      alert('Failed to approve leave request: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [leaveId]: false }));
    }
  };

  const handleReject = async (leaveId, notes) => {
    if (!notes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setActionLoading(prev => ({ ...prev, [leaveId]: true }));
    try {
      await leaveService.rejectLeaveRequest(leaveId, notes);
      fetchLeaves();
      closeActionModal();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      alert('Failed to reject leave request: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [leaveId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    const colorClasses = leaveService.getStatusColor(status);
    return `${baseClasses} ${colorClasses}`;
  };

  const getLeaveTypeBadge = (leaveType) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    const colorClasses = leaveService.getLeaveTypeColor(leaveType);
    return `${baseClasses} ${colorClasses}`;
  };

  const leaveTypes = leaveService.getLeaveTypes();
  const statusOptions = leaveService.getStatusOptions();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by reason..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="form-input pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="form-input"
              >
                <option value="">All Statuses</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <select
                value={filters.employee_id}
                onChange={(e) => handleFilterChange('employee_id', e.target.value)}
                className="form-input"
              >
                <option value="">All Employees</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
              <select
                value={filters.leave_type}
                onChange={(e) => handleFilterChange('leave_type', e.target.value)}
                className="form-input"
              >
                <option value="">All Types</option>
                {leaveTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No leave requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leave Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {leave.employees?.first_name} {leave.employees?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {leave.employees?.employee_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={getLeaveTypeBadge(leave.leave_type)}>
                              {leave.leave_type}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {leaveService.formatDisplayDate(leave.start_date)} - {leaveService.formatDisplayDate(leave.end_date)}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {leave.reason}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.days_requested} day{leave.days_requested !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(leave.status)}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {leaveService.formatDisplayDate(leave.submitted_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {leave.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => openActionModal('approve', leave)}
                                disabled={actionLoading[leave.id]}
                                className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => openActionModal('reject', leave)}
                                disabled={actionLoading[leave.id]}
                                className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                              >
                                <XCircle className="h-4 w-4" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedLeave(leave)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="card-footer">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      pagination.page === i + 1
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                {actionModal.type === 'approve' ? (
                  <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600 mr-2" />
                )}
                <h3 className="text-lg font-medium text-gray-900">
                  {actionModal.type === 'approve' ? 'Approve' : 'Reject'} Leave Request
                </h3>
              </div>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Employee:</strong> {actionModal.leave?.employees?.first_name} {actionModal.leave?.employees?.last_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Dates:</strong> {leaveService.formatDisplayDate(actionModal.leave?.start_date)} - {leaveService.formatDisplayDate(actionModal.leave?.end_date)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Type:</strong> {actionModal.leave?.leave_type}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {actionModal.type === 'approve' ? 'Notes (Optional)' : 'Rejection Reason *'}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={actionModal.type === 'approve' 
                    ? 'Add any notes for the employee...' 
                    : 'Please provide a reason for rejection...'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required={actionModal.type === 'reject'}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeActionModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (actionModal.type === 'approve') {
                      handleApprove(actionModal.leave.id, adminNotes);
                    } else {
                      handleReject(actionModal.leave.id, adminNotes);
                    }
                  }}
                  disabled={actionLoading[actionModal.leave?.id] || (actionModal.type === 'reject' && !adminNotes.trim())}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    actionModal.type === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {actionLoading[actionModal.leave?.id] ? 'Processing...' : 
                    (actionModal.type === 'approve' ? 'Approve' : 'Reject')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Details Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Leave Request Details</h3>
                <button
                  onClick={() => setSelectedLeave(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employee</label>
                    <p className="text-sm text-gray-900">
                      {selectedLeave.employees?.first_name} {selectedLeave.employees?.last_name} ({selectedLeave.employees?.employee_id})
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Leave Type</label>
                    <div className="mt-1">
                      <span className={getLeaveTypeBadge(selectedLeave.leave_type)}>
                        {selectedLeave.leave_type}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <span className={getStatusBadge(selectedLeave.status)}>
                        {selectedLeave.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Duration</label>
                    <p className="text-sm text-gray-900">
                      {selectedLeave.days_requested} day{selectedLeave.days_requested !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Start Date</label>
                    <p className="text-sm text-gray-900">
                      {leaveService.formatDisplayDate(selectedLeave.start_date)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">End Date</label>
                    <p className="text-sm text-gray-900">
                      {leaveService.formatDisplayDate(selectedLeave.end_date)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Submitted On</label>
                    <p className="text-sm text-gray-900">
                      {leaveService.formatDisplayDate(selectedLeave.submitted_at)}
                    </p>
                  </div>

                  {selectedLeave.reviewed_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Reviewed On</label>
                      <p className="text-sm text-gray-900">
                        {leaveService.formatDisplayDate(selectedLeave.reviewed_at)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="text-sm font-medium text-gray-500">Reason</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {selectedLeave.reason}
                </p>
              </div>

              {selectedLeave.admin_notes && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500">Admin Notes</label>
                  <p className="mt-1 text-sm text-gray-900 bg-yellow-50 p-3 rounded-md">
                    {selectedLeave.admin_notes}
                  </p>
                </div>
              )}

              {selectedLeave.status === 'Pending' && (
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setSelectedLeave(null);
                      openActionModal('reject', selectedLeave);
                    }}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLeave(null);
                      openActionModal('approve', selectedLeave);
                    }}
                    className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagementDashboard;