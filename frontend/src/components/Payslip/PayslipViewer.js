import React, { useState, useRef, useEffect } from 'react';
import Payslip from './Payslip';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import './PayslipViewer.css';

const PayslipViewer = ({ employeeId }) => {
  const [payslipData, setPayslipData] = useState(null);
  const [availablePayslips, setAvailablePayslips] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState({ year: 2025, month: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const payslipRef = useRef();

  // Fetch available payslips on component mount
  useEffect(() => {
    const fetchAvailablePayslips = async () => {
      try {
        setError(null);
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5000/api/payslips/employee/${employeeId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        setAvailablePayslips(response.data.payslips);
        
        // Set the latest available payslip as default
        if (response.data.payslips.length > 0) {
          const latest = response.data.payslips[0];
          setSelectedPeriod({ year: latest.year, month: latest.month });
        }
      } catch (error) {
        console.error('Error fetching available payslips:', error);
        setError('Failed to fetch available payslips');
      }
    };

    if (employeeId) {
      fetchAvailablePayslips();
    }
  }, [employeeId]);

  // Fetch payslip data when period changes
  useEffect(() => {
    const fetchPayslipData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5000/api/payslips/employee/${employeeId}/${selectedPeriod.year}/${selectedPeriod.month}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        setPayslipData(response.data.payslip);
      } catch (error) {
        console.error('Error fetching payslip data:', error);
        setError('Failed to fetch payslip data');
        setPayslipData(null);
      } finally {
        setLoading(false);
      }
    };

    if (employeeId && selectedPeriod.year && selectedPeriod.month) {
      fetchPayslipData();
    }
  }, [employeeId, selectedPeriod]);

  const handlePeriodChange = (year, month) => {
    setSelectedPeriod({ year: parseInt(year), month: parseInt(month) });
  };

  const refreshPayslip = async () => {
    if (employeeId && selectedPeriod.year && selectedPeriod.month) {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5000/api/payslips/employee/${employeeId}/${selectedPeriod.year}/${selectedPeriod.month}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        setPayslipData(response.data.payslip);
      } catch (error) {
        console.error('Error fetching payslip data:', error);
        setError('Failed to fetch payslip data');
        setPayslipData(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const downloadPayslipPDF = async () => {
    if (!payslipData || !payslipRef.current) return;

    try {
      setIsGeneratingPDF(true);
      
      // Add PDF-specific class for better formatting
      payslipRef.current.classList.add('payslip-pdf');
      
      // Configure html2canvas options for better quality
      const canvas = await html2canvas(payslipRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800, // Fixed width for consistency
        height: payslipRef.current.scrollHeight
      });

      // Remove PDF class
      payslipRef.current.classList.remove('payslip-pdf');

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const heightLeft = imgHeight;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // If content exceeds one page, add more pages
      if (heightLeft >= pageHeight) {
        let position = heightLeft - pageHeight;
        while (position > 0) {
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
          position -= pageHeight;
        }
      }

      // Generate filename
      const filename = `Payslip_${payslipData.employee.firstName}_${payslipData.employee.lastName}_${payslipData.payPeriod.monthName}_${payslipData.payPeriod.year}.pdf`;
      
      // Download the PDF
      pdf.save(filename);

    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const printPayslip = () => {
    if (!payslipRef.current) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Payslip - ${payslipData?.employee?.firstName} ${payslipData?.employee?.lastName}</title>
          <style>
            body { margin: 0; font-family: Arial, sans-serif; }
            @media print {
              body { margin: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${payslipRef.current.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (!employeeId) {
    return (
      <div className="payslip-viewer-container">
        <div className="no-employee">Please select an employee to view payslips.</div>
      </div>
    );
  }

  return (
    <div className="payslip-viewer-container">
      {/* Controls Section */}
      <div className="payslip-controls">
        <div className="period-selector">
          <label htmlFor="payslip-period">Select Pay Period:</label>
          <select
            id="payslip-period"
            value={`${selectedPeriod.year}-${selectedPeriod.month}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-');
              handlePeriodChange(year, month);
            }}
            disabled={loading}
          >
            {availablePayslips.map((payslip) => (
              <option key={`${payslip.year}-${payslip.month}`} value={`${payslip.year}-${payslip.month}`}>
                {payslip.period}
              </option>
            ))}
          </select>
        </div>

        <div className="action-buttons">
          <button
            onClick={downloadPayslipPDF}
            disabled={!payslipData || isGeneratingPDF}
            className="download-btn"
          >
            {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
          </button>
          <button
            onClick={printPayslip}
            disabled={!payslipData || loading}
            className="print-btn"
          >
            Print Payslip
          </button>
          <button
            onClick={refreshPayslip}
            disabled={loading}
            className="refresh-btn"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading payslip data...</p>
        </div>
      )}

      {/* Payslip Display */}
      {payslipData && !loading && (
        <div className="payslip-display">
          <div ref={payslipRef}>
            <Payslip payslipData={payslipData} />
          </div>
        </div>
      )}

      {/* No Data State */}
      {!payslipData && !loading && !error && availablePayslips.length === 0 && (
        <div className="no-data-state">
          <h3>No Payslips Available</h3>
          <p>No payslip data found for this employee. Please contact HR if you believe this is an error.</p>
        </div>
      )}
    </div>
  );
};

export default PayslipViewer;