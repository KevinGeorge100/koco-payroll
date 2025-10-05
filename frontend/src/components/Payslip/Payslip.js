import React from 'react';
import './Payslip.css';

const Payslip = ({ payslipData, className = "" }) => {
  if (!payslipData) {
    return <div className="payslip-loading">Loading payslip...</div>;
  }

  const { employee, payPeriod, attendance, earnings, deductions, netSalary } = payslipData;

  return (
    <div className={`payslip-container ${className}`} id="payslip-template">
      {/* Header Section */}
      <div className="payslip-header">
        <div className="company-info">
          <h1>KOCO Payroll System</h1>
          <p>Employee Payslip</p>
        </div>
        <div className="payslip-period">
          <h2>Pay Period</h2>
          <p>{payPeriod.monthName} {payPeriod.year}</p>
          <p className="date-range">
            {new Date(payPeriod.startDate).toLocaleDateString()} - {new Date(payPeriod.endDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Employee Information */}
      <div className="employee-section">
        <h3>Employee Information</h3>
        <div className="employee-grid">
          <div className="employee-detail">
            <label>Employee ID:</label>
            <span>{employee.employeeNumber}</span>
          </div>
          <div className="employee-detail">
            <label>Name:</label>
            <span>{employee.firstName} {employee.lastName}</span>
          </div>
          <div className="employee-detail">
            <label>Designation:</label>
            <span>{employee.designation}</span>
          </div>
          <div className="employee-detail">
            <label>Department:</label>
            <span>{employee.department}</span>
          </div>
          <div className="employee-detail">
            <label>Email:</label>
            <span>{employee.email}</span>
          </div>
          <div className="employee-detail">
            <label>Joining Date:</label>
            <span>{new Date(employee.joiningDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="attendance-section">
        <h3>Attendance Summary</h3>
        <div className="attendance-grid">
          <div className="attendance-item">
            <label>Total Working Days:</label>
            <span>{attendance.totalWorkingDays}</span>
          </div>
          <div className="attendance-item">
            <label>Days Present:</label>
            <span>{attendance.attendedDays}</span>
          </div>
          <div className="attendance-item">
            <label>Days Absent:</label>
            <span>{attendance.absentDays}</span>
          </div>
          <div className="attendance-item">
            <label>Leave Days:</label>
            <span>{attendance.leaveDays}</span>
          </div>
          <div className="attendance-item">
            <label>Weekends:</label>
            <span>{attendance.weekends}</span>
          </div>
          <div className="attendance-item highlight">
            <label>Attendance:</label>
            <span>{attendance.attendancePercentage}%</span>
          </div>
        </div>
      </div>

      {/* Salary Breakdown */}
      <div className="salary-section">
        <div className="earnings-column">
          <h3>Earnings</h3>
          <div className="salary-table">
            <div className="salary-row">
              <span className="salary-label">Basic Salary</span>
              <span className="salary-amount">₹{earnings.basicSalary.toLocaleString()}</span>
            </div>
            <div className="salary-row">
              <span className="salary-label">House Rent Allowance</span>
              <span className="salary-amount">₹{earnings.hra.toLocaleString()}</span>
            </div>
            <div className="salary-row">
              <span className="salary-label">Dearness Allowance</span>
              <span className="salary-amount">₹{earnings.da.toLocaleString()}</span>
            </div>
            <div className="salary-row">
              <span className="salary-label">Medical Allowance</span>
              <span className="salary-amount">₹{earnings.medicalAllowance.toLocaleString()}</span>
            </div>
            <div className="salary-row">
              <span className="salary-label">Conveyance Allowance</span>
              <span className="salary-amount">₹{earnings.conveyanceAllowance.toLocaleString()}</span>
            </div>
            <div className="salary-row total-row">
              <span className="salary-label">Gross Salary</span>
              <span className="salary-amount">₹{earnings.grossSalary.toLocaleString()}</span>
            </div>
            {attendance.attendancePercentage < 100 && (
              <div className="salary-row adjustment-row">
                <span className="salary-label">After Attendance Adjustment</span>
                <span className="salary-amount">₹{earnings.salaryAfterAttendance.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="deductions-column">
          <h3>Deductions</h3>
          <div className="salary-table">
            <div className="salary-row">
              <span className="salary-label">Provident Fund (PF)</span>
              <span className="salary-amount">₹{deductions.pf.toLocaleString()}</span>
            </div>
            <div className="salary-row">
              <span className="salary-label">Employee State Insurance</span>
              <span className="salary-amount">₹{deductions.esi.toLocaleString()}</span>
            </div>
            <div className="salary-row">
              <span className="salary-label">Professional Tax</span>
              <span className="salary-amount">₹{deductions.professionalTax.toLocaleString()}</span>
            </div>
            <div className="salary-row">
              <span className="salary-label">Income Tax (TDS)</span>
              <span className="salary-amount">₹{deductions.incomeTax.toLocaleString()}</span>
            </div>
            <div className="salary-row total-row">
              <span className="salary-label">Total Deductions</span>
              <span className="salary-amount">₹{deductions.totalDeductions.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Net Salary */}
      <div className="net-salary-section">
        <div className="net-salary-box">
          <h3>Net Salary</h3>
          <div className="net-amount">₹{netSalary.toLocaleString()}</div>
          <p className="amount-words">
            Amount in words: {numberToWords(netSalary)} Rupees Only
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="payslip-footer">
        <div className="footer-info">
          <p>Generated on: {new Date(payslipData.generatedAt).toLocaleDateString()}</p>
          <p>This is a computer-generated payslip and does not require a signature.</p>
        </div>
        <div className="footer-note">
          <p><strong>Note:</strong> Please verify all details and contact HR for any discrepancies.</p>
        </div>
      </div>
    </div>
  );
};

// Helper function to convert numbers to words (simplified)
const numberToWords = (num) => {
  if (num === 0) return "Zero";
  
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  
  const convertHundreds = (n) => {
    let result = "";
    
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + " ";
      return result;
    }
    
    if (n > 0) {
      result += ones[n] + " ";
    }
    
    return result;
  };
  
  if (num >= 10000000) { // Crores
    return convertHundreds(Math.floor(num / 10000000)) + "Crore " + numberToWords(num % 10000000);
  }
  
  if (num >= 100000) { // Lakhs
    return convertHundreds(Math.floor(num / 100000)) + "Lakh " + numberToWords(num % 100000);
  }
  
  if (num >= 1000) { // Thousands
    return convertHundreds(Math.floor(num / 1000)) + "Thousand " + numberToWords(num % 1000);
  }
  
  return convertHundreds(num).trim();
};

export default Payslip;