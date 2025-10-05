import React from 'react';
import { CheckCircle, XCircle, Clock, Filter, Search } from 'lucide-react';

const LeaveRequestsPage = () => {
  const leaveRequests = [
    {
      id: 1,
      employee: 'John Smith',
      type: 'Vacation',
      startDate: '2025-10-15',
      endDate: '2025-10-20',
      days: 5,
      status: 'pending',
      reason: 'Family vacation',
      submittedDate: '2025-10-01'
    },
    {
      id: 2,
      employee: 'Sarah Johnson',
      type: 'Sick Leave',
      startDate: '2025-10-08',
      endDate: '2025-10-09',
      days: 2,
      status: 'approved',
      reason: 'Medical appointment',
      submittedDate: '2025-10-05'
    },
    {
      id: 3,
      employee: 'Mike Wilson',
      type: 'Personal',
      startDate: '2025-10-12',
      endDate: '2025-10-12',
      days: 1,
      status: 'rejected',
      reason: 'Personal matters',
      submittedDate: '2025-10-03'
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'status-badge-success';
      case 'rejected':
        return 'status-badge-error';
      case 'pending':
        return 'status-badge-warning';
      default:
        return 'status-badge-info';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage employee leave requests and approvals
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search requests..."
            className="form-input pl-10"
          />
        </div>
        <select className="form-select">
          <option>All Status</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>
        <button className="btn-secondary">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </button>
      </div>

      {/* Requests Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Leave Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Employee</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Start Date</th>
                <th className="table-header-cell">End Date</th>
                <th className="table-header-cell">Days</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {leaveRequests.map((request) => (
                <tr key={request.id}>
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">{request.employee}</div>
                      <div className="text-xs text-gray-500">Submitted: {request.submittedDate}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {request.type}
                    </span>
                  </td>
                  <td className="table-cell">{request.startDate}</td>
                  <td className="table-cell">{request.endDate}</td>
                  <td className="table-cell">{request.days}</td>
                  <td className="table-cell">
                    <span className={`status-badge ${getStatusBadge(request.status)} flex items-center`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1 capitalize">{request.status}</span>
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      {request.status === 'pending' && (
                        <>
                          <button className="btn-success text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </button>
                          <button className="btn-danger text-xs">
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </button>
                        </>
                      )}
                      <button className="btn-secondary text-xs">View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestsPage;