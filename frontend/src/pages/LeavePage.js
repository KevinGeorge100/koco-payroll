import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Plus, Settings } from 'lucide-react';
import LeaveRequestForm from '../components/LeaveRequestForm';
import LeaveManagementDashboard from '../components/LeaveManagementDashboard';
import employeeService from '../services/employeeService';
import leaveService from '../services/leaveService';
import { useAuth } from '../context/AuthContext';

const LeaveMyRequests = () => {
  const { user } = useAuth();
  const [myLeaves, setMyLeaves] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentEmployee = useCallback(async () => {
    try {
      if (user) {
        const response = await employeeService.getEmployees();
        const employee = response.data.find(emp => emp.user_id === user.id);
        setCurrentEmployee(employee);
      }
    } catch (error) {
      console.error('Error fetching current employee:', error);
    }
  }, [user]);

  const fetchMyLeaves = useCallback(async () => {
    if (!currentEmployee) return;
    
    setLoading(true);
    try {
      const response = await leaveService.getEmployeeLeaveRequests(currentEmployee.id);
      setMyLeaves(response.data || []);
    } catch (error) {
      console.error('Error fetching my leaves:', error);
    } finally {
      setLoading(false);
    }
  }, [currentEmployee]);

  useEffect(() => {
    fetchCurrentEmployee();
  }, [fetchCurrentEmployee]);

  useEffect(() => {
    if (currentEmployee) {
      fetchMyLeaves();
    }
  }, [currentEmployee, fetchMyLeaves]);

  const handleRequestSubmitted = () => {
    fetchMyLeaves();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaveRequestForm 
          employeeId={currentEmployee?.id}
          onSubmitSuccess={handleRequestSubmitted} 
        />
        
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">My Leave Requests</h3>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : myLeaves.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No leave requests found</p>
                <p className="text-sm text-gray-400 mt-1">Submit your first leave request using the form</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myLeaves.slice(0, 5).map(leave => (
                  <div key={leave.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            leave.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {leave.status}
                          </span>
                          <span className="text-sm text-gray-500">{leave.leave_type}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">{leave.days_requested} days</p>
                      </div>
                    </div>
                  </div>
                ))}
                {myLeaves.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    Showing 5 of {myLeaves.length} requests
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LeavePage = () => {
  const location = useLocation();
  const { user } = useAuth();

  const fetchUserRole = useCallback(async () => {
    try {
      if (user) {
        const response = await employeeService.getEmployees();
        const employee = response.data.find(emp => emp.user_id === user.id);
        // For debugging - you can check if role exists
        console.log('Employee data:', employee);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  // For now, allow all users to access management features
  // You can add role-based restrictions later when roles are properly set up
  const isHROrAdmin = true; // Temporarily allow all users to access management
  
  const tabs = [
    {
      name: 'My Requests',
      href: '/leaves',
      icon: Plus,
      description: 'Submit and view your leave requests',
      current: location.pathname === '/leaves' || location.pathname === '/leaves/'
    }
  ];

  // Add management tab for HR/Admin users
  if (isHROrAdmin) {
    tabs.push({
      name: 'Manage Requests',
      href: '/leaves/manage',
      icon: Settings,
      description: 'Review and approve leave requests',
      current: location.pathname === '/leaves/manage'
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Submit leave requests and track their status
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                to={tab.href}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  tab.current
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className={`mr-2 h-5 w-5 ${
                  tab.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <Routes>
        <Route path="/" element={<LeaveMyRequests />} />
        {isHROrAdmin && (
          <Route path="/manage" element={<LeaveManagementDashboard />} />
        )}
      </Routes>
    </div>
  );
};

export default LeavePage;