import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Save, X } from 'lucide-react';
import { employeeService } from '../services/employeeService';
import attendanceService from '../services/attendanceService';

const AttendanceCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [tempAttendance, setTempAttendance] = useState({});

  // Status options for attendance
  const statusOptions = [
    { value: 'Present', label: 'Present', color: 'bg-green-100 text-green-800' },
    { value: 'Absent', label: 'Absent', color: 'bg-red-100 text-red-800' },
    { value: 'Leave', label: 'Leave', color: 'bg-blue-100 text-blue-800' },
    { value: 'Half Day', label: 'Half Day', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'Late', label: 'Late', color: 'bg-orange-100 text-orange-800' }
  ];

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getEmployees({ limit: 100 });
      setEmployees(response.employees || []);
    } catch (err) {
      setError('Failed to fetch employees');
      console.error('Error fetching employees:', err);
    }
  };

  const fetchMonthlyAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const response = await attendanceService.getAttendanceByDateRange(startDate, endDate);
      
      // Group attendance by date and employee
      const attendanceMap = {};
      response.attendance.forEach(record => {
        const dateKey = record.date;
        if (!attendanceMap[dateKey]) {
          attendanceMap[dateKey] = {};
        }
        attendanceMap[dateKey][record.employee_id] = record;
      });
      
      setAttendance(attendanceMap);
    } catch (err) {
      setError('Failed to fetch attendance data');
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    if (currentDate) {
      fetchMonthlyAttendance();
    }
  }, [currentDate, fetchMonthlyAttendance]);

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getAttendanceForDate = (date) => {
    const dateKey = formatDate(date);
    return attendance[dateKey] || {};
  };

  const getAttendanceStats = (date) => {
    const dayAttendance = getAttendanceForDate(date);
    const stats = {
      present: 0,
      absent: 0,
      leave: 0,
      halfDay: 0,
      late: 0,
      total: Object.keys(dayAttendance).length
    };

    Object.values(dayAttendance).forEach(record => {
      switch (record.status) {
        case 'Present': stats.present++; break;
        case 'Absent': stats.absent++; break;
        case 'Leave': stats.leave++; break;
        case 'Half Day': stats.halfDay++; break;
        case 'Late': stats.late++; break;
        default: break;
      }
    });

    return stats;
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowMarkAttendance(true);
    
    // Initialize temp attendance with existing data
    const dateKey = formatDate(date);
    const existingAttendance = attendance[dateKey] || {};
    const temp = {};
    
    employees.forEach(emp => {
      temp[emp.id] = existingAttendance[emp.id]?.status || 'Present';
    });
    
    setTempAttendance(temp);
  };

  const handleStatusChange = (employeeId, status) => {
    setTempAttendance(prev => ({
      ...prev,
      [employeeId]: status
    }));
  };

  const saveAttendance = async () => {
    if (!selectedDate) return;

    try {
      setSaving(true);
      setError(null);
      
      const dateKey = formatDate(selectedDate);
      const attendanceRecords = [];
      
      Object.entries(tempAttendance).forEach(([employeeId, status]) => {
        attendanceRecords.push({
          employee_id: employeeId,
          status: status
        });
      });

      await attendanceService.markDailyAttendance(dateKey, attendanceRecords);
      
      // Refresh attendance data
      await fetchMonthlyAttendance();
      
      setShowMarkAttendance(false);
      setSelectedDate(null);
    } catch (err) {
      setError('Failed to save attendance. Please try again.');
      console.error('Error saving attendance:', err);
    } finally {
      setSaving(false);
    }
  };

  const today = new Date();
  const isToday = (date) => {
    return date.toDateString() === today.toDateString();
  };

  const isFutureDate = (date) => {
    return date > today;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Calendar</h1>
          <p className="mt-1 text-sm text-gray-500">
            Mark daily attendance and view attendance history
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Calendar Navigation */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="card-body">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {getDaysInMonth().map((date, index) => {
              if (!date) {
                return <div key={index} className="p-2"></div>;
              }
              
              const stats = getAttendanceStats(date);
              const hasAttendance = stats.total > 0;
              const canMarkAttendance = !isFutureDate(date);
              
              return (
                <div
                  key={date.getDate()}
                  className={`p-2 border rounded-lg cursor-pointer transition-colors ${
                    isToday(date) 
                      ? 'border-blue-500 bg-blue-50' 
                      : hasAttendance 
                        ? 'border-green-200 bg-green-50 hover:bg-green-100'
                        : canMarkAttendance
                          ? 'border-gray-200 hover:bg-gray-50'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                  }`}
                  onClick={() => canMarkAttendance && handleDateClick(date)}
                >
                  <div className="text-center">
                    <div className={`text-sm ${isToday(date) ? 'font-bold text-blue-600' : 'text-gray-900'}`}>
                      {date.getDate()}
                    </div>
                    {hasAttendance && (
                      <div className="mt-1 space-y-1">
                        <div className="flex justify-center space-x-1">
                          {stats.present > 0 && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" title={`${stats.present} Present`}></div>
                          )}
                          {stats.absent > 0 && (
                            <div className="w-2 h-2 bg-red-500 rounded-full" title={`${stats.absent} Absent`}></div>
                          )}
                          {stats.leave > 0 && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" title={`${stats.leave} Leave`}></div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {stats.total} emp
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showMarkAttendance && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Mark Attendance - {selectedDate.toLocaleDateString()}
              </h3>
              <button
                onClick={() => setShowMarkAttendance(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {employees.map(employee => (
                <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {employee.first_name?.[0]}{employee.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {employee.first_name} {employee.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{employee.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {statusOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleStatusChange(employee.id, option.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          tempAttendance[employee.id] === option.value
                            ? option.color
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowMarkAttendance(false)}
                className="btn btn-secondary"
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={saveAttendance}
                className="btn btn-primary"
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;