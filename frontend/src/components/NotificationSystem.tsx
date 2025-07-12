import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { 
  BellIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  type: 'new_visitor' | 'check_in' | 'check_out' | 'no_show' | 'reminder' | 'approval_request' | 'approval_approved' | 'approval_rejected';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  visitId?: number;
  employeeName?: string;
  visitorName?: string;
}

interface NotificationSystemProps {
  visitors: any[];
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ 
  visitors, 
  onNotificationClick 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check user role
  const isLobbyAttendant = user?.groups?.includes('lobby_attendant');
  const isEmployee = user?.groups?.includes('employee');
  const currentUsername = user?.username;

  // Get storage key for this user
  const getStorageKey = () => `notifications_${currentUsername}_${new Date().toDateString()}`;

  // Load read notifications from localStorage
  const loadReadNotifications = (): Set<string> => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (error) {
      console.error('Error loading read notifications:', error);
      return new Set();
    }
  };

  // Save read notifications to localStorage
  const saveReadNotifications = (readIds: Set<string>) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(Array.from(readIds)));
    } catch (error) {
      console.error('Error saving read notifications:', error);
    }
  };

  // Generate notifications from visitor data based on user role
  const processedNotifications = useMemo(() => {
    const readIds = loadReadNotifications();
    const newNotifications: Notification[] = [];
    const now = new Date();

    // Only log in development and limit the frequency
    if (process.env.NODE_ENV === 'development' && visitors.length > 0) {
      console.log('🔔 NotificationSystem: Processing', visitors.length, 'visitors for', currentUsername);
    }

    visitors.forEach((visitor, index) => {
      // Only log in development for the first few visitors
      if (process.env.NODE_ENV === 'development' && index < 3) {
        console.log(`🔔 Processing visitor ${index + 1}:`, visitor.visitor_name);
      }

      // For Lobby Attendants - see all visitor notifications
      if (isLobbyAttendant) {
        // New visitor notification (if scheduled within last 30 minutes)
        const scheduledTime = new Date(visitor.scheduled_time);
        const timeDiff = now.getTime() - scheduledTime.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        
        if (minutesDiff >= -30 && minutesDiff <= 30 && visitor.status === 'approved') {
          const notificationId = `new_${visitor.visit_id}`;
          newNotifications.push({
            id: notificationId,
            type: 'new_visitor',
            title: 'New Visitor Scheduled',
            message: `${visitor.visitor_name} is scheduled to arrive at ${scheduledTime.toLocaleTimeString()}`,
            timestamp: scheduledTime,
            read: readIds.has(notificationId),
            visitId: visitor.visit_id,
            employeeName: visitor.employee_name,
            visitorName: visitor.visitor_name
          });
        }

        // Check-in notification
        if (visitor.is_checked_in && visitor.check_in_time) {
          const checkInTime = new Date(visitor.check_in_time);
          const checkInDiff = now.getTime() - checkInTime.getTime();
          const checkInMinutesDiff = checkInDiff / (1000 * 60);
          
          if (checkInMinutesDiff <= 30) {
            const notificationId = `checkin_${visitor.visit_id}`;
            newNotifications.push({
              id: notificationId,
              type: 'check_in',
              title: 'Visitor Checked In',
              message: `${visitor.visitor_name} has checked in to meet ${visitor.employee_name}`,
              timestamp: checkInTime,
              read: readIds.has(notificationId),
              visitId: visitor.visit_id,
              employeeName: visitor.employee_name,
              visitorName: visitor.visitor_name
            });
          }
        }

        // Check-out notification
        if (visitor.is_checked_out && visitor.check_out_time) {
          const checkOutTime = new Date(visitor.check_out_time);
          const checkOutDiff = now.getTime() - checkOutTime.getTime();
          const checkOutMinutesDiff = checkOutDiff / (1000 * 60);
          
          if (checkOutMinutesDiff <= 30) {
            const notificationId = `checkout_${visitor.visit_id}`;
            newNotifications.push({
              id: notificationId,
              type: 'check_out',
              title: 'Visitor Checked Out',
              message: `${visitor.visitor_name} has checked out after meeting ${visitor.employee_name}`,
              timestamp: checkOutTime,
              read: readIds.has(notificationId),
              visitId: visitor.visit_id,
              employeeName: visitor.employee_name,
              visitorName: visitor.visitor_name
            });
          }
        }

        // No-show reminder (15+ minutes late)
        if (!visitor.is_checked_in && visitor.status === 'approved') {
          const scheduledUTC = new Date(visitor.scheduled_time);
          const timeDiff = now.getTime() - scheduledUTC.getTime();
          const minutesLate = timeDiff / (1000 * 60);
          
          // Add buffer to prevent false positives
          const bufferMinutes = 1;
          if (minutesLate >= (15 + bufferMinutes) && minutesLate <= 45) {
            const notificationId = `reminder_${visitor.visit_id}`;
            newNotifications.push({
              id: notificationId,
              type: 'reminder',
              title: 'Visitor Running Late',
              message: `${visitor.visitor_name} is ${Math.floor(minutesLate)} minutes late to meet ${visitor.employee_name}`,
              timestamp: new Date(scheduledUTC.getTime() + 15 * 60 * 1000),
              read: readIds.has(notificationId),
              visitId: visitor.visit_id,
              employeeName: visitor.employee_name,
              visitorName: visitor.visitor_name
            });
          }
        }

        // No-show notification (30+ minutes late)
        if (!visitor.is_checked_in && visitor.status === 'approved') {
          const scheduledUTC = new Date(visitor.scheduled_time);
          const timeDiff = now.getTime() - scheduledUTC.getTime();
          const minutesLate = timeDiff / (1000 * 60);
          
          // Add buffer to prevent false positives
          const bufferMinutes = 1;
          if (minutesLate >= (30 + bufferMinutes) && minutesLate <= 120) { // Show for 2 hours after 30 min late
            const notificationId = `noshow_${visitor.visit_id}`;
            newNotifications.push({
              id: notificationId,
              type: 'no_show',
              title: 'Visitor No-Show',
              message: `${visitor.visitor_name} is ${Math.floor(minutesLate)} minutes late and may be a no-show`,
              timestamp: new Date(scheduledUTC.getTime() + 30 * 60 * 1000),
              read: readIds.has(notificationId),
              visitId: visitor.visit_id,
              employeeName: visitor.employee_name,
              visitorName: visitor.visitor_name
            });
          }
        }
      }
      
      // For Employees - only see notifications about their own visitors
      else if (isEmployee && visitor.employee_name === currentUsername) {
        // New visitor notification for employee
        const scheduledTime = new Date(visitor.scheduled_time);
        const timeDiff = now.getTime() - scheduledTime.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        
        if (minutesDiff >= -30 && minutesDiff <= 30 && visitor.status === 'approved') {
          const notificationId = `new_${visitor.visit_id}`;
          newNotifications.push({
            id: notificationId,
            type: 'new_visitor',
            title: 'Visitor Coming to Meet You',
            message: `${visitor.visitor_name} is scheduled to arrive at ${scheduledTime.toLocaleTimeString()}`,
            timestamp: scheduledTime,
            read: readIds.has(notificationId),
            visitId: visitor.visit_id,
            employeeName: visitor.employee_name,
            visitorName: visitor.visitor_name
          });
        }

        // Check-in notification for employee
        if (visitor.is_checked_in && visitor.check_in_time) {
          const checkInTime = new Date(visitor.check_in_time);
          const checkInDiff = now.getTime() - checkInTime.getTime();
          const checkInMinutesDiff = checkInDiff / (1000 * 60);
          
          if (checkInMinutesDiff <= 30) {
            const notificationId = `checkin_${visitor.visit_id}`;
            newNotifications.push({
              id: notificationId,
              type: 'check_in',
              title: 'Your Visitor Has Arrived',
              message: `${visitor.visitor_name} has checked in and is waiting for you`,
              timestamp: checkInTime,
              read: readIds.has(notificationId),
              visitId: visitor.visit_id,
              employeeName: visitor.employee_name,
              visitorName: visitor.visitor_name
            });
          }
        }

        // Check-out notification for employee
        if (visitor.is_checked_out && visitor.check_out_time) {
          console.log('🔔 NotificationSystem: ✅ Found checked-out visitor:', visitor.visitor_name);
          const checkOutTime = new Date(visitor.check_out_time);
          const checkOutDiff = now.getTime() - checkOutTime.getTime();
          const checkOutMinutesDiff = checkOutDiff / (1000 * 60);
          
          console.log('🔔 NotificationSystem: Check-out time diff:', checkOutMinutesDiff, 'minutes');
          
          if (checkOutMinutesDiff <= 30) {
            console.log('🔔 NotificationSystem: Creating check-out notification');
            const notificationId = `checkout_${visitor.visit_id}`;
            newNotifications.push({
              id: notificationId,
              type: 'check_out',
              title: 'Your Visitor Has Left',
              message: `${visitor.visitor_name} has checked out and left the building`,
              timestamp: checkOutTime,
              read: readIds.has(notificationId),
              visitId: visitor.visit_id,
              employeeName: visitor.employee_name,
              visitorName: visitor.visitor_name
            });
          } else {
            console.log('🔔 NotificationSystem: Check-out too old (>30 minutes)');
          }
        } else {
          console.log('🔔 NotificationSystem: Visitor not checked out or no check-out time');
        }

        // No-show notification for employee (30+ minutes late)
        if (!visitor.is_checked_in && visitor.status === 'approved') {
          const scheduledUTC = new Date(visitor.scheduled_time);
          const timeDiff = now.getTime() - scheduledUTC.getTime();
          const minutesLate = timeDiff / (1000 * 60);
          
          // Add buffer to prevent false positives
          const bufferMinutes = 1;
          if (minutesLate >= (30 + bufferMinutes) && minutesLate <= 120) { // Show for 2 hours after 30 min late
            console.log('🔔 NotificationSystem: Creating no-show notification for employee');
            const notificationId = `noshow_${visitor.visit_id}`;
            newNotifications.push({
              id: notificationId,
              type: 'no_show',
              title: 'Your Visitor May Be a No-Show',
              message: `${visitor.visitor_name} is ${Math.floor(minutesLate)} minutes late and hasn't arrived yet`,
              timestamp: new Date(scheduledUTC.getTime() + 30 * 60 * 1000),
              read: readIds.has(notificationId),
              visitId: visitor.visit_id,
              employeeName: visitor.employee_name,
              visitorName: visitor.visitor_name
            });
          }
        }
      } else if (isEmployee) {
        console.log('🔔 NotificationSystem: ❌ Employee visitor mismatch:', {
          visitor_employee: visitor.employee_name,
          current_user: currentUsername,
          match: visitor.employee_name === currentUsername
        });
      }
    });

    // Sort by timestamp (newest first)
    newNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔔 NotificationSystem: Created', newNotifications.length, 'notifications');
    }
    
    return newNotifications;
  }, [visitors, isLobbyAttendant, isEmployee, currentUsername]);

  // Update notifications state when processedNotifications changes
  useEffect(() => {
    setNotifications(processedNotifications);
    setUnreadCount(processedNotifications.filter(n => !n.read).length);
  }, [processedNotifications]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Save to localStorage
    const readIds = loadReadNotifications();
    readIds.add(notificationId);
    saveReadNotifications(readIds);
  };

  const markAllAsRead = () => {
    const readIds = new Set(notifications.map(n => n.id));
    saveReadNotifications(readIds);
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Call the parent callback if provided
    onNotificationClick?.(notification);
    
    // Navigate based on user role and notification type
    if (isLobbyAttendant) {
      navigate('/lobby');
    } else if (isEmployee) {
      // Employees go to their visitors page
      navigate('/my-visitors');
    }
    
    // Close notification panel
    setShowNotifications(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_visitor':
        return <UserPlusIcon className="h-5 w-5 text-blue-300" />;
      case 'check_in':
        return <CheckCircleIcon className="h-5 w-5 text-green-300" />;
      case 'check_out':
        return <XMarkIcon className="h-5 w-5 text-gray-300" />;
      case 'no_show':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-300" />;
      case 'reminder':
        return <ClockIcon className="h-5 w-5 text-yellow-300" />;
      case 'approval_request':
        return <ClockIcon className="h-5 w-5 text-purple-300" />;
      case 'approval_approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-300" />;
      case 'approval_rejected':
        return <XMarkIcon className="h-5 w-5 text-red-300" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-300" />;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Don't show notification bell if user is not authenticated or has no relevant notifications
  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md transition-all duration-200 hover:shadow-lg"
      >
        <BellIcon className="h-6 w-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {isLobbyAttendant ? 'Visitor Notifications' : 'My Notifications'}
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
                <p className="text-xs text-gray-400 mt-1">
                  {isLobbyAttendant ? 'No visitor updates' : 'No updates for your visitors'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">
                            {formatTimeAgo(notification.timestamp)}
                          </p>
                          <span className="text-xs text-blue-600 font-medium">
                            Click to view →
                          </span>
                        </div>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with quick action */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowNotifications(false);
                  if (isLobbyAttendant) {
                    navigate('/lobby');
                  } else if (isEmployee) {
                    navigate('/my-visitors');
                  }
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium text-center"
              >
                {isLobbyAttendant ? 'View All Visitors in Lobby' : 'View My Visitors'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationSystem; 