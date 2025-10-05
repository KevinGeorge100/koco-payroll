import React from 'react';
import { Users, Plus, Search, Filter } from 'lucide-react';

const DepartmentsPage = () => {
  const departments = [
    { id: 1, name: 'Engineering', manager: 'John Smith', employees: 12, budget: 250000 },
    { id: 2, name: 'Sales', manager: 'Sarah Johnson', employees: 8, budget: 180000 },
    { id: 3, name: 'Marketing', manager: 'Mike Wilson', employees: 5, budget: 120000 },
    { id: 4, name: 'Human Resources', manager: 'Lisa Brown', employees: 3, budget: 90000 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage company departments and organizational structure
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments..."
            className="form-input pl-10"
          />
        </div>
        <button className="btn-secondary">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="card hover:shadow-lg transition-shadow">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Manager:</span>
                  <span className="font-medium">{dept.manager}</span>
                </div>
                <div className="flex justify-between">
                  <span>Employees:</span>
                  <span className="font-medium">{dept.employees}</span>
                </div>
                <div className="flex justify-between">
                  <span>Budget:</span>
                  <span className="font-medium">${dept.budget.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="btn-secondary text-sm w-full">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentsPage;