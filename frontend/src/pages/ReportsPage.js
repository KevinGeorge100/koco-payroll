import React from 'react';
import { BarChart3, Download, FileText, TrendingUp, DollarSign, Users, Clock } from 'lucide-react';

const ReportsPage = () => {
  const reportCategories = [
    {
      title: 'Payroll Reports',
      description: 'Generate comprehensive payroll analysis and summaries',
      icon: DollarSign,
      color: 'text-green-600 bg-green-100',
      reports: [
        'Monthly Payroll Summary',
        'Tax Deduction Report',
        'Benefits Cost Analysis',
        'Overtime Report'
      ]
    },
    {
      title: 'Attendance Reports',
      description: 'Track employee attendance and time management',
      icon: Clock,
      color: 'text-blue-600 bg-blue-100',
      reports: [
        'Attendance Summary',
        'Late Arrivals Report',
        'Absence Analysis',
        'Time Tracking Report'
      ]
    },
    {
      title: 'Employee Reports',
      description: 'Analyze employee data and performance metrics',
      icon: Users,
      color: 'text-purple-600 bg-purple-100',
      reports: [
        'Employee Directory',
        'Headcount Analysis',
        'Department Breakdown',
        'New Hire Report'
      ]
    },
    {
      title: 'Financial Reports',
      description: 'Financial analysis and cost management reports',
      icon: TrendingUp,
      color: 'text-orange-600 bg-orange-100',
      reports: [
        'Cost Center Analysis',
        'Budget vs Actual',
        'Financial Summary',
        'Expense Reports'
      ]
    }
  ];

  const quickReports = [
    { name: 'Current Month Payroll', status: 'Ready', lastGenerated: '2025-10-01' },
    { name: 'Weekly Attendance', status: 'Processing', lastGenerated: '2025-10-05' },
    { name: 'Employee Count', status: 'Ready', lastGenerated: '2025-10-04' },
    { name: 'Tax Summary', status: 'Ready', lastGenerated: '2025-09-30' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate and download various payroll and HR reports
          </p>
        </div>
        <button className="btn-primary">
          <FileText className="h-4 w-4 mr-2" />
          Custom Report
        </button>
      </div>

      {/* Quick Reports */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Quick Reports</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickReports.map((report, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{report.name}</h4>
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  Last: {report.lastGenerated}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    report.status === 'Ready' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {report.status}
                  </span>
                  <button className="btn-secondary text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportCategories.map((category, index) => {
          const Icon = category.icon;
          return (
            <div key={index} className="card hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg ${category.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {category.reports.map((report, reportIndex) => (
                    <div key={reportIndex} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{report}</span>
                      <button className="btn-secondary text-xs">
                        Generate
                      </button>
                    </div>
                  ))}
                </div>
                
                <button className="btn-primary w-full">
                  View All {category.title}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Reports */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Reports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Report Name</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Generated</th>
                <th className="table-header-cell">Size</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              <tr>
                <td className="table-cell">October 2025 Payroll Summary</td>
                <td className="table-cell">
                  <span className="status-badge-success">Payroll</span>
                </td>
                <td className="table-cell">Oct 5, 2025 2:30 PM</td>
                <td className="table-cell">2.4 MB</td>
                <td className="table-cell">
                  <div className="flex items-center space-x-2">
                    <button className="btn-secondary text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </button>
                    <button className="btn-secondary text-xs">View</button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="table-cell">Weekly Attendance Report</td>
                <td className="table-cell">
                  <span className="status-badge-info">Attendance</span>
                </td>
                <td className="table-cell">Oct 5, 2025 9:00 AM</td>
                <td className="table-cell">1.8 MB</td>
                <td className="table-cell">
                  <div className="flex items-center space-x-2">
                    <button className="btn-secondary text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </button>
                    <button className="btn-secondary text-xs">View</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;