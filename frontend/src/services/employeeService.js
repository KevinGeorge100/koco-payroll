import api from '../lib/api';

export const employeeService = {
  // Get all employees with optional filters
  async getEmployees(params = {}) {
    const response = await api.get('/employees', { params });
    return response.data;
  },

  // Get a single employee by ID
  async getEmployee(id) {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  // Create a new employee
  async createEmployee(employeeData) {
    const response = await api.post('/employees', employeeData);
    return response.data;
  },

  // Update an existing employee
  async updateEmployee(id, employeeData) {
    const response = await api.put(`/employees/${id}`, employeeData);
    return response.data;
  },

  // Delete an employee
  async deleteEmployee(id) {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  }
};

export default employeeService;