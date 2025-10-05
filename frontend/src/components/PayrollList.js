import React, { useState, useEffect, useCallback } from 'react';
import { payrollService } from '../services/payrollService';
import LoadingSpinner from './LoadingSpinner';

const PayrollList = ({ year, month, refreshTrigger, onRecordSelect }) => {
  const [loading, setLoading] = useState(false);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [error, setError] = useState(null);

  const fetchPayrollRecords = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters = { year, month };
      const data = await payrollService.getPayrollRecords(filters);
      setPayrollRecords(data);
    } catch (error) {
      console.error('Error fetching payroll records:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    if (year && month) {
      fetchPayrollRecords();
    }
  }, [year, month, refreshTrigger, fetchPayrollRecords]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      draft: 'bg-gray-100 text-gray-800',
      calculated: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      paid: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleStatusUpdate = async (recordId, newStatus) => {
    try {
      await payrollService.updatePayrollStatus(recordId, newStatus);
      fetchPayrollRecords(); // Refresh the list
    } catch (error) {
      console.error('Error updating payroll status:', error);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body flex justify-center items-center py-12">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading payroll records: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900">
          Payroll Records {year && month && `- ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`}
        </h3>
      </div>
      <div className="card-body">
        {payrollRecords.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No payroll records found for the selected period.</p>
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
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrollRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.employee?.first_name} {record.employee?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {record.employee?.employee_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.employee?.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(record.gross_salary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(record.gross_salary - record.net_salary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(record.net_salary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onRecordSelect && onRecordSelect(record)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {record.status === 'calculated' && (
                          <button
                            onClick={() => handleStatusUpdate(record.id, 'approved')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                        )}
                        {record.status === 'approved' && (
                          <button
                            onClick={() => handleStatusUpdate(record.id, 'paid')}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollList;