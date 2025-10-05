import React, { useState } from 'react';
import PayrollCalculator from '../components/PayrollCalculator';
import PayrollSummary from '../components/PayrollSummary';
import PayrollList from '../components/PayrollList';
import PayrollDetail from '../components/PayrollDetail';

const PayrollPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedPayrollId, setSelectedPayrollId] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  const handleCalculationComplete = () => {
    // Trigger refresh of summary and list components
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRecordSelect = (record) => {
    setSelectedPayrollId(record.id);
  };

  const handleCloseDetail = () => {
    setSelectedPayrollId(null);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
        
        {/* Period Selector */}
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">Period:</label>
          <select
            value={selectedPeriod.year}
            onChange={(e) => setSelectedPeriod({ ...selectedPeriod, year: parseInt(e.target.value) })}
            className="input text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select
            value={selectedPeriod.month}
            onChange={(e) => setSelectedPeriod({ ...selectedPeriod, month: parseInt(e.target.value) })}
            className="input text-sm"
          >
            {monthNames.map((month, index) => (
              <option key={index + 1} value={index + 1}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'records'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Payroll Records
          </button>
          <button
            onClick={() => setActiveTab('calculate')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'calculate'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Calculate Payroll
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'summary' && (
          <PayrollSummary
            year={selectedPeriod.year}
            month={selectedPeriod.month}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'records' && (
          <PayrollList
            year={selectedPeriod.year}
            month={selectedPeriod.month}
            refreshTrigger={refreshTrigger}
            onRecordSelect={handleRecordSelect}
          />
        )}

        {activeTab === 'calculate' && (
          <PayrollCalculator onCalculationComplete={handleCalculationComplete} />
        )}
      </div>

      {/* Payroll Detail Modal */}
      {selectedPayrollId && (
        <PayrollDetail
          payrollId={selectedPayrollId}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
};

export default PayrollPage;