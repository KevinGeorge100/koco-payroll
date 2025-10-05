import React, { useState, useEffect } from 'react';
import { payrollService } from '../services/payrollService';
import { employeeService } from '../services/employeeService';
import LoadingSpinner from './LoadingSpinner';

const PayrollCalculator = ({ onCalculationComplete }) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(true);
  const [calculationData, setCalculationData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getEmployees({ status: 'active' });
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleEmployeeSelect = (employeeId, checked) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    } else {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    }
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedEmployees(employees.map(emp => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        year: calculationData.year,
        month: calculationData.month,
        ...(selectAll ? {} : { employee_ids: selectedEmployees })
      };

      const response = await payrollService.calculatePayroll(payload);
      setResult(response);
      
      if (onCalculationComplete) {
        onCalculationComplete(response);
      }
    } catch (error) {
      console.error('Error calculating payroll:', error);
      setResult({
        message: 'Error calculating payroll',
        successful: 0,
        failed: 1,
        errors: [{ error: error.message }]
      });
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900">Calculate Monthly Payroll</h3>
      </div>
      <div className="card-body space-y-6">
        {/* Period Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={calculationData.year}
              onChange={(e) => setCalculationData({ ...calculationData, year: parseInt(e.target.value) })}
              className="input"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={calculationData.month}
              onChange={(e) => setCalculationData({ ...calculationData, month: parseInt(e.target.value) })}
              className="input"
            >
              {monthNames.map((month, index) => (
                <option key={index + 1} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Employee Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Employees</label>
          <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="select-all"
                checked={selectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
                Select All Employees
              </label>
            </div>
            
            {!selectAll && (
              <div className="space-y-2">
                {employees.map(employee => (
                  <div key={employee.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`employee-${employee.id}`}
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={(e) => handleEmployeeSelect(employee.id, e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor={`employee-${employee.id}`} className="text-sm text-gray-700">
                      {employee.first_name} {employee.last_name} - {employee.employee_id}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Calculate Button */}
        <div className="flex justify-end">
          <button
            onClick={handleCalculate}
            disabled={loading || (!selectAll && selectedEmployees.length === 0)}
            className="btn btn-primary flex items-center"
          >
            {loading && <LoadingSpinner className="w-4 h-4 mr-2" />}
            Calculate Payroll
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="border-t pt-4">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Calculation Results</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-600">Successful</p>
                <p className="text-2xl font-bold text-green-800">{result.successful}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-600">Failed</p>
                <p className="text-2xl font-bold text-red-800">{result.failed}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-600">Total</p>
                <p className="text-2xl font-bold text-blue-800">{result.successful + result.failed}</p>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-red-800 mb-2">Errors:</h5>
                <ul className="text-sm text-red-700 space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index}>
                      Employee ID: {error.employee_id} - {error.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollCalculator;