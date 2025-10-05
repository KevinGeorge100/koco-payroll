import api from '../lib/api';

export const attendanceService = {
  // Get attendance records with optional filters
  async getAttendance(params = {}) {
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  // Get a single attendance record by ID
  async getAttendanceRecord(id) {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
  },

  // Create a new attendance record
  async createAttendance(attendanceData) {
    const response = await api.post('/attendance', attendanceData);
    return response.data;
  },

  // Update an existing attendance record
  async updateAttendance(id, attendanceData) {
    const response = await api.put(`/attendance/${id}`, attendanceData);
    return response.data;
  },

  // Delete an attendance record
  async deleteAttendance(id) {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  },

  // Bulk create attendance records
  async bulkCreateAttendance(attendanceRecords) {
    const response = await api.post('/attendance/bulk', { attendance: attendanceRecords });
    return response.data;
  },

  // Get attendance summary for an employee
  async getAttendanceSummary(employeeId, month, year) {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    
    const response = await api.get(`/attendance/summary/${employeeId}`, { params });
    return response.data;
  },

  // Get attendance for a specific date range
  async getAttendanceByDateRange(startDate, endDate, employeeId = null) {
    const params = {
      start_date: startDate,
      end_date: endDate
    };
    
    if (employeeId) {
      params.employee_id = employeeId;
    }
    
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  // Get attendance for a specific date
  async getAttendanceByDate(date, employeeId = null) {
    const params = { date };
    
    if (employeeId) {
      params.employee_id = employeeId;
    }
    
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  // Mark attendance for multiple employees on a specific date
  async markDailyAttendance(date, attendanceData) {
    const attendanceRecords = attendanceData.map(record => ({
      ...record,
      date
    }));
    
    return this.bulkCreateAttendance(attendanceRecords);
  }
};

export default attendanceService;