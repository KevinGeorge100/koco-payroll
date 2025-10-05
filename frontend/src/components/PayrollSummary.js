import React, { useState, useEffect, useCallback } from 'react';
import { payrollService } from '../services/payrollService';
import LoadingSpinner from './LoadingSpinner';

const PayrollSummary = ({ year, month, refreshTrigger }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await payrollService.getPayrollSummary(year, month);
      setSummary(data);
    } catch (error) {
      console.error('Error fetching payroll summary:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    if (year && month) {
      fetchSummary();
    }
  }, [year, month, refreshTrigger, fetchSummary]);

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
            <p className="text-red-800">Error loading summary: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="card">
        <div className="card-body">
          <p className="text-gray-500 text-center py-8">
            Select a year and month to view payroll summary
          </p>
        </div>
      </div>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'calculated':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900">
          Payroll Summary - {monthNames[month - 1]} {year}
        </h3>
      </div>
      <div className="card-body space-y-6">
        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-600">Total Employees</p>
            <p className="text-2xl font-bold text-blue-900">{summary.total_employees}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-green-600">Gross Salary</p>
            <p className="text-2xl font-bold text-green-900">
              {formatCurrency(summary.total_gross_salary)}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-purple-600">Net Salary</p>
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(summary.total_net_salary)}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-red-600">Tax Deductions</p>
            <p className="text-2xl font-bold text-red-900">
              {formatCurrency(summary.total_tax_deduction)}
            </p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">Status Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(summary.status_breakdown).map(([status, count]) => (
              <div key={status} className="border rounded-lg p-3 text-center">
                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getStatusColor(status)}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </div>
                <p className="text-xl font-bold text-gray-900">{count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Insights */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-md font-semibold text-gray-900 mb-2">Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p><strong>Average Gross Salary:</strong> {
                summary.total_employees > 0 
                  ? formatCurrency(summary.total_gross_salary / summary.total_employees)
                  : '$0'
              }</p>
              <p><strong>Average Net Salary:</strong> {
                summary.total_employees > 0 
                  ? formatCurrency(summary.total_net_salary / summary.total_employees)
                  : '$0'
              }</p>
            </div>
            <div>
              <p><strong>Total Deductions:</strong> {
                formatCurrency(summary.total_gross_salary - summary.total_net_salary)
              }</p>
              <p><strong>Effective Tax Rate:</strong> {
                summary.total_gross_salary > 0 
                  ? ((summary.total_tax_deduction / summary.total_gross_salary) * 100).toFixed(1)
                  : '0'
              }%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollSummary;