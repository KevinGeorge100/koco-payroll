import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Calendar, List } from 'lucide-react';
import AttendanceCalendar from '../components/AttendanceCalendar';
import AttendanceHistory from '../components/AttendanceHistory';

const AttendancePage = () => {
  const location = useLocation();
  
  const tabs = [
    {
      name: 'Calendar',
      href: '/attendance',
      icon: Calendar,
      description: 'Mark daily attendance',
      current: location.pathname === '/attendance' || location.pathname === '/attendance/'
    },
    {
      name: 'History',
      href: '/attendance/history',
      icon: List,
      description: 'View attendance records',
      current: location.pathname === '/attendance/history'
    }
  ];

  return (
    <div className="space-y-6">
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
                  tab.current 
                    ? 'text-blue-500' 
                    : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <Routes>
        <Route path="/" element={<AttendanceCalendar />} />
        <Route path="/history" element={<AttendanceHistory />} />
      </Routes>
    </div>
  );
};

export default AttendancePage;