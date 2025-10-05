import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  DollarSign,
  FileText,
  Menu,
  X,
  LogOut,
  Settings,
  Search,
  Bell,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Enhanced navigation with nested items and categories
const navigationSections = [
  {
    name: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Overview and analytics' }
    ]
  },
  {
    name: 'Employee Management',
    collapsible: true,
    items: [
      { name: 'All Employees', href: '/employees', icon: Users, description: 'Manage employee records' },
      { name: 'Add Employee', href: '/employees/new', icon: UserPlus, description: 'Add new employee' }
    ]
  },
  {
    name: 'Attendance',
    items: [
      { name: 'Attendance', href: '/attendance', icon: Calendar, description: 'Mark and track attendance' }
    ]
  },
  {
    name: 'Leave Management',
    items: [
      { name: 'Leave Requests', href: '/leaves', icon: Calendar, description: 'Submit and manage leave requests' }
    ]
  },
  {
    name: 'Payroll',
    collapsible: true,
    items: [
      { name: 'Payroll Management', href: '/payroll', icon: DollarSign, description: 'Manage employee payroll and salaries' },
      { name: 'Payslips', href: '/payslips', icon: FileText, description: 'View and download employee payslips' }
    ]
  }
];

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { userRole } = useRole();
  const location = useLocation();

  // Use all navigation sections without role filtering (rollback)
  const filteredNavigationSections = navigationSections;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleSection = (sectionName) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const isActiveLink = (href) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const getUserInitials = (user) => {
    if (!user?.user_metadata) return 'U';
    const first = user.user_metadata.first_name?.[0] || '';
    const last = user.user_metadata.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getUserRole = (user) => {
    return user?.user_metadata?.role || 'employee';
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'hr': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" 
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Enhanced Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          
          {/* Logo and Close Button */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-primary-600">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-primary-600" />
                </div>
              </div>
              <h1 className="ml-3 text-xl font-bold text-white">KOCO Payroll</h1>
            </div>
            <button
              className="lg:hidden p-2 rounded-md text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {filteredNavigationSections.map((section) => {
              const sectionCollapsed = collapsedSections[section.name];
              
              return (
                <div key={section.name} className="space-y-1">
                  
                  {/* Section Header */}
                  {section.collapsible ? (
                    <button
                      onClick={() => toggleSection(section.name)}
                      className="flex items-center justify-between w-full px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 focus:outline-none focus:text-gray-700"
                      aria-expanded={!sectionCollapsed}
                    >
                      <span>{section.name}</span>
                      {sectionCollapsed ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {section.name}
                    </div>
                  )}

                  {/* Section Items */}
                  {(!section.collapsible || !sectionCollapsed) && (
                    <div className="space-y-1">
                      {section.items
                        .filter(item => 
                          searchQuery === '' || 
                          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((item) => {
                          const isActive = isActiveLink(item.href);
                          return (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isActive
                                  ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-500'
                                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                              }`}
                              aria-current={isActive ? 'page' : undefined}
                            >
                              <item.icon 
                                className={`mr-3 h-5 w-5 transition-colors ${
                                  isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                                }`} 
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs text-gray-500 truncate">{item.description}</div>
                              </div>
                              {isActive && (
                                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                              )}
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Enhanced User Menu */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className={`h-10 w-10 rounded-full ${getRoleBadgeColor(userRole || 'employee')} flex items-center justify-center font-medium text-sm`}>
                  {getUserInitials(user)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getRoleBadgeColor(userRole || 'employee')}`}>
                  {(userRole || 'employee').charAt(0).toUpperCase() + (userRole || 'employee').slice(1)}
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              <Link
                to="/profile"
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <Settings className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                Profile Settings
              </Link>
              
              {/* User Management - now accessible to everyone */}
              <Link
                to="/admin/users"
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <Users className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                User Management
              </Link>
              
              <button
                onClick={handleSignOut}
                className="w-full group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <LogOut className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Sticky Top Navigation Bar */}
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            
            {/* Left Side - Mobile Menu Button */}
            <div className="flex items-center">
              <button
                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              {/* Breadcrumb or Page Title */}
              <div className="ml-4 lg:ml-0">
                <h1 className="text-lg font-semibold text-gray-900 capitalize">
                  {location.pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Dashboard'}
                </h1>
              </div>
            </div>

            {/* Right Side - Search, Notifications, User Menu */}
            <div className="flex items-center space-x-4">
              
              {/* Desktop Search */}
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-expanded={userMenuOpen}
                >
                  <div className={`h-8 w-8 rounded-full ${getRoleBadgeColor(getUserRole(user))} flex items-center justify-center font-medium text-xs`}>
                    {getUserInitials(user)}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.user_metadata?.first_name}
                    </p>
                    <p className="text-xs text-gray-500">{getUserRole(user)}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleSignOut();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Click outside handler for user menu */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => setUserMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Layout;