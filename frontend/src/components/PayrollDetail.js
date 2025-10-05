import React, { useState, useEffect, useCallback } from 'react';
import { payrollService } from '../services/payrollService';
import LoadingSpinner from './LoadingSpinner';

const PayrollDetail = ({ payrollId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [payrollDetail, setPayrollDetail] = useState(null);
  const [error, setError] = useState(null);

  const fetchPayrollDetail = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await payrollService.getPayrollById(payrollId);
      setPayrollDetail(data);
    } catch (error) {
      console.error('Error fetching payroll detail:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [payrollId]);

  useEffect(() => {
    if (payrollId) {
      fetchPayrollDetail();
    }
  }, [payrollId, fetchPayrollDetail]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner className="w-8 h-8" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Error</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading payroll detail: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!payrollDetail) {
    return null;
  }

  const totalBonuses = payrollDetail.bonuses?.reduce((sum, bonus) => sum + parseFloat(bonus.amount || 0), 0) || 0;
  const totalDeductions = payrollDetail.deductions?.reduce((sum, deduction) => sum + parseFloat(deduction.amount || 0), 0) || 0;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Payroll Detail</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Employee Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Employee Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{payrollDetail.employee?.first_name} {payrollDetail.employee?.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Employee ID</p>
                <p className="font-medium">{payrollDetail.employee?.employee_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">{payrollDetail.employee?.department}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Position</p>
                <p className="font-medium">{payrollDetail.employee?.position}</p>
              </div>
            </div>
          </div>

          {/* Payroll Period */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Payroll Period</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-blue-600">Month/Year</p>
                <p className="font-medium">{new Date(payrollDetail.year, payrollDetail.month - 1).toLocaleString('default', { month: 'long' })} {payrollDetail.year}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Days Worked</p>
                <p className="font-medium">{payrollDetail.days_worked}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  payrollDetail.status === 'paid' ? 'bg-green-100 text-green-800' :
                  payrollDetail.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                  payrollDetail.status === 'calculated' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {payrollDetail.status.charAt(0).toUpperCase() + payrollDetail.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Earnings</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Base Salary</span>
                  <span className="font-medium">{formatCurrency(payrollDetail.base_salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Overtime</span>
                  <span className="font-medium">{formatCurrency(payrollDetail.overtime_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bonuses</span>
                  <span className="font-medium">{formatCurrency(totalBonuses)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Gross Salary</span>
                  <span className="text-green-600">{formatCurrency(payrollDetail.gross_salary)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Deductions</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tax</span>
                  <span className="font-medium">{formatCurrency(payrollDetail.tax_deduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Other Deductions</span>
                  <span className="font-medium">{formatCurrency(totalDeductions)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total Deductions</span>
                  <span className="text-red-600">{formatCurrency(payrollDetail.gross_salary - payrollDetail.net_salary)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <h4 className="text-lg font-medium text-gray-900 mb-2">Net Salary</h4>
            <p className="text-3xl font-bold text-purple-600">{formatCurrency(payrollDetail.net_salary)}</p>
          </div>

          {/* Detailed Bonuses */}
          {payrollDetail.bonuses && payrollDetail.bonuses.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Bonus Details</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payrollDetail.bonuses.map((bonus) => (
                      <tr key={bonus.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{bonus.description}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{bonus.bonus_type}</td>
                        <td className="px-4 py-2 text-sm font-medium text-green-600">{formatCurrency(bonus.amount)}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{formatDate(bonus.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detailed Deductions */}
          {payrollDetail.deductions && payrollDetail.deductions.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Deduction Details</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payrollDetail.deductions.map((deduction) => (
                      <tr key={deduction.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{deduction.description}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{deduction.deduction_type}</td>
                        <td className="px-4 py-2 text-sm font-medium text-red-600">{formatCurrency(deduction.amount)}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{formatDate(deduction.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollDetail;