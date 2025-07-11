import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useVisitors } from './VisitorContext';
import NotificationSystem from './NotificationSystem';
import { 
  HomeIcon, 
  PlusIcon, 
  ClipboardDocumentListIcon,
  ClockIcon,
  BuildingOfficeIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  Bars3Icon,
  XMarkIcon,
  UserPlusIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { visitors } = useVisitors();
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Add state for dropdown
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Role-based navigation
  const isLobbyAttendant = user?.groups?.includes('lobby_attendant');

  // Employee navigation (no My Visitors for lobby attendants)
  const employeeNavItems = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Create Visit', href: '/create-visit', icon: PlusIcon },
    { name: 'Visit Requests', href: '/visit-requests', icon: ClipboardDocumentListIcon },
            { name: 'Pending Check-ins', href: '/pending-approvals', icon: ClockIcon },
  ];
  // Only add My Visitors if not lobby attendant
  if (!isLobbyAttendant) {
    employeeNavItems.push({ name: 'My Visitors', href: '/my-visitors', icon: UserGroupIcon });
  }
  const attendantNavItems = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Lobby', href: '/lobby', icon: UserGroupIcon },
    { name: 'Walk-in', href: '/walkin', icon: UserPlusIcon },
    { name: 'Reports', href: '/reports', icon: DocumentArrowDownIcon },
  ];

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  // Responsive nav items - only determine when authenticated
  const navItems = isAuthenticated ? (isLobbyAttendant ? attendantNavItems : employeeNavItems) : [];

  // Add effect to close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  // Close mobile menu when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }

    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [mobileMenuOpen]);

  return (
    <nav className="relative z-50 w-full h-20 min-h-16 flex items-center shadow-lg border-b-4 border-blue-900 overflow-visible bg-gradient-to-r from-blue-900 via-indigo-900 to-gray-900 animate-gradient-x">
      {/* Animated border glow */}
      <div className="absolute -top-1 left-0 w-full h-1 bg-gradient-to-r from-blue-700 via-indigo-500 to-purple-700 blur-lg opacity-60 animate-pulse" style={{zIndex: 1}}></div>
      {/* Animated background gradient */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-900 via-indigo-900 to-gray-900 animate-gradient-x" style={{zIndex: 0, animation: 'gradient-x 8s ease-in-out infinite'}}></div>
      {/* Floating decorative circles (hidden on mobile) */}
      <div className="hidden sm:block absolute top-3 left-1/4 w-3 h-3 bg-blue-700 rounded-full opacity-70 animate-pulse" style={{zIndex: 2}}></div>
      <div className="hidden sm:block absolute top-6 right-1/3 w-2 h-2 bg-indigo-700 rounded-full opacity-50 animate-bounce" style={{zIndex: 2}}></div>
      <div className="hidden sm:block absolute bottom-3 left-1/2 w-2 h-2 bg-purple-700 rounded-full opacity-60 animate-ping" style={{zIndex: 2}}></div>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 w-full relative z-10">
        <div className="flex justify-between h-16 items-center w-full">
          {/* Logo and brand */}
          <div className="flex items-center flex-shrink-0 group">
            <div className="relative">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-200 group-hover:text-blue-400 transition-all duration-300 transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-blue-200 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </div>
            <span className="ml-2 text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-200 via-blue-100 to-indigo-200 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-indigo-300 transition-all duration-300">
              GatePassPro
            </span>
          </div>

          {/* Hamburger menu for mobile */}
          <div className="flex sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-nav-button inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-7 w-7" />
              ) : (
                <Bars3Icon className="block h-7 w-7" />
              )}
            </button>
          </div>

          {/* Desktop nav links */}
          <div className="hidden sm:flex space-x-2 md:space-x-6 lg:space-x-8 items-center">
            {isAuthenticated && navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const isItemHovered = isHovered === item.name;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onMouseEnter={() => setIsHovered(item.name)}
                  onMouseLeave={() => setIsHovered(null)}
                  className={`relative inline-flex items-center px-2 md:px-3 py-2 rounded-lg text-sm md:text-base font-medium transition-all duration-300 transform hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md
  ${isActive ? 'text-white bg-gradient-to-r from-blue-700 to-indigo-900 shadow-xl animate-pulse' : 'text-gray-200 hover:text-blue-900 hover:bg-blue-100'}
`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg animate-pulse opacity-20"></div>
                  )}
                  {isItemHovered && !isActive && (
                    <div className="absolute inset-0 bg-blue-100 rounded-lg transition-all duration-300"></div>
                  )}
                  <item.icon className={`h-5 w-5 mr-2 transition-all duration-300 ${
                    isActive ? 'text-white' : isItemHovered ? 'text-blue-900' : 'text-gray-400'
                  }`} />
                  <span className="relative z-10">{item.name}</span>
                  <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ${
                    isActive ? 'w-full' : isItemHovered ? 'w-full' : 'w-0'
                  }`}></div>
                </Link>
              );
            })}
          </div>

          {/* User info and logout (desktop) */}
          {isAuthenticated ? (
            <div className="hidden sm:flex items-center space-x-2 md:space-x-4" ref={userDropdownRef}>
              {/* Notification System */}
              <NotificationSystem 
                visitors={visitors}
                onNotificationClick={(notification) => {
                  console.log('Notification clicked:', notification);
                }}
              />
              
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen((open) => !open)}
                  className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm rounded-lg px-2 md:px-3 py-2 border border-blue-100 hover:border-blue-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <UserIcon className="h-5 w-5 text-blue-500" />
                  <span className="text-xs md:text-sm font-medium text-gray-700">
                    {user?.username}
                  </span>
                  <svg className={`h-4 w-4 ml-1 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-blue-100 rounded-lg shadow-lg z-50 animate-fade-in">
                    <button
                      onClick={() => { handleLogout(); setUserDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-b-lg transition-colors duration-200"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2 inline" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex items-center">
              <Link
                to="/login"
                className="group relative inline-flex items-center px-4 py-2 border border-transparent text-xs md:text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <UserIcon className="h-4 w-4 mr-2 relative z-10" />
                <span className="relative z-10">Sign In</span>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-menu-overlay sm:hidden fixed inset-0 z-[9998] bg-black bg-opacity-50 backdrop-blur-sm" 
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}
      
      {/* Mobile menu panel */}
      <div 
        className={`mobile-menu-panel sm:hidden fixed top-0 left-0 w-[85%] max-w-[320px] h-full bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile menu header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center group">
            <BuildingOfficeIcon className="h-7 w-7 text-blue-600 group-hover:text-blue-700 transition-all duration-300" />
            <span className="ml-2 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              GatePassPro
            </span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)} 
            className="p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Mobile menu content */}
        <div className="flex flex-col h-full">
          {/* Navigation items */}
          <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {isAuthenticated && navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`mobile-menu-item flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActive 
                      ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg' 
                      : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50 active:bg-blue-100'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${
                    isActive ? 'text-white' : 'text-gray-500'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
          
          {/* Mobile menu footer */}
          <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
            {isAuthenticated ? (
              <div className="space-y-3">
                {/* Notification System for Mobile */}
                <div className="flex items-center justify-center">
                  <NotificationSystem 
                    visitors={visitors}
                    onNotificationClick={(notification) => {
                      console.log('Notification clicked:', notification);
                      setMobileMenuOpen(false);
                    }}
                  />
                </div>
                
                {/* User info */}
                <div className="flex items-center space-x-3 bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {user?.username}
                  </span>
                </div>
                
                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-3 border border-red-200 text-base font-medium rounded-lg text-red-600 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all duration-200 shadow-sm"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
              >
                <UserIcon className="h-5 w-5 mr-2" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

// Add CSS styles for better mobile support
const mobileStyles = `
@keyframes gradient-x {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.animate-gradient-x {
  background-size: 200% 200%;
  animation: gradient-x 8s ease-in-out infinite;
}

/* Mobile menu improvements */
@media (max-width: 375px) {
  .mobile-menu-panel {
    width: 90% !important;
    max-width: 300px !important;
  }
}

/* Ensure mobile menu is always on top */
.mobile-menu-overlay {
  z-index: 9998 !important;
}

.mobile-menu-panel {
  z-index: 9999 !important;
}

/* Touch-friendly mobile buttons */
@media (max-width: 640px) {
  .mobile-nav-button {
    min-height: 44px;
    min-width: 44px;
  }
  
  .mobile-menu-item {
    min-height: 48px;
    padding: 12px 16px;
  }
}

/* Prevent body scroll when mobile menu is open */
body.mobile-menu-open {
  overflow: hidden;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'navbar-mobile-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = mobileStyles;
    document.head.appendChild(style);
  }
} 