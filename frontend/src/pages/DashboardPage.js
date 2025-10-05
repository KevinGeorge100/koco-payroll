import React from 'react';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Welcome back, {user?.user_metadata?.first_name || 'User'}! Manage your employees, track attendance, and handle leave requests.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Employee Management</h3>
            <p className="text-gray-500 mb-4">
              Manage your team members and their information.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• View and manage all employees</li>
              <li>• Add new employees to your team</li>
              <li>• Edit employee information</li>
              <li>• Search and filter employees</li>
            </ul>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Attendance Tracking</h3>
            <p className="text-gray-500 mb-4">
              Track daily attendance for all employees.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Mark daily attendance on calendar</li>
              <li>• View attendance history and records</li>
              <li>• Track employee presence status</li>
              <li>• Generate attendance reports</li>
            </ul>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Leave Management</h3>
            <p className="text-gray-500 mb-4">
              Submit and manage employee leave requests.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Submit leave requests with dates</li>
              <li>• Track request approval status</li>
              <li>• Approve/reject requests (HR/Admin)</li>
              <li>• Automatic attendance integration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;