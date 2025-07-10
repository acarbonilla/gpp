import React, { useState, useRef, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface TouchOptimizedCardProps {
  visitor: any;
  onNoShow: (visitId: number) => void;
  onCheckIn?: (visitId: number) => void;
  onCheckOut?: (visitId: number) => void;
  markingNoShow: number | null;
}

const TouchOptimizedCard: React.FC<TouchOptimizedCardProps> = ({
  visitor,
  onNoShow,
  onCheckIn,
  onCheckOut,
  markingNoShow
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragDistance, setDragDistance] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);

  const SWIPE_THRESHOLD = 80;
  const MAX_DRAG = 120;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    currentX.current = e.touches[0].clientX;
    const distance = startX.current - currentX.current;
    
    if (distance > 0) { // Only allow left swipe
      setDragDistance(Math.min(distance, MAX_DRAG));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (dragDistance > SWIPE_THRESHOLD) {
      setShowActions(true);
      // Auto-hide actions after 3 seconds
      setTimeout(() => setShowActions(false), 3000);
    }
    
    setDragDistance(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    currentX.current = startX.current;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    currentX.current = e.clientX;
    const distance = startX.current - currentX.current;
    
    if (distance > 0) {
      setDragDistance(Math.min(distance, MAX_DRAG));
    }
  };

  const handleMouseUp = () => {
    handleTouchEnd();
  };

  const getStatusIcon = () => {
    if (visitor.is_checked_in && !visitor.is_checked_out) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else if (visitor.is_checked_out) {
      return <XCircleIcon className="h-5 w-5 text-gray-500" />;
    } else if (visitor.status === 'no_show') {
      return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
    } else {
      return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    if (visitor.is_checked_in && !visitor.is_checked_out) {
      return 'Checked In';
    } else if (visitor.is_checked_out) {
      return 'Checked Out';
    } else if (visitor.status === 'no_show') {
      return 'No Show';
    } else {
      return 'Pending';
    }
  };

  const getStatusColor = () => {
    if (visitor.is_checked_in && !visitor.is_checked_out) {
      return 'bg-green-100 text-green-800';
    } else if (visitor.is_checked_out) {
      return 'bg-gray-100 text-gray-800';
    } else if (visitor.status === 'no_show') {
      return 'bg-orange-100 text-orange-800';
    } else {
      return 'bg-yellow-100 text-yellow-800';
    }
  };

  const shouldShowNoShowButton = () => {
    const nowUTC = new Date();
    const scheduledUTC = new Date(visitor.scheduled_time);
    const timeDiff = nowUTC.getTime() - scheduledUTC.getTime();
    const minutesLate = timeDiff / (1000 * 60);

    return !visitor.is_checked_in &&
           visitor.status === 'approved' &&
           minutesLate >= 15;
  };

  return (
    <div className="relative overflow-hidden">
      {/* Action Buttons (Hidden behind card) */}
      <div className="absolute right-0 top-0 h-full flex items-center bg-gradient-to-l from-red-500 to-orange-500 rounded-r-lg transition-all duration-300"
           style={{ 
             width: showActions ? '120px' : '0px',
             opacity: showActions ? 1 : 0
           }}>
        <div className="flex flex-col space-y-2 px-3">
          {shouldShowNoShowButton() && (
            <button
              onClick={() => onNoShow(visitor.visit_id)}
              disabled={markingNoShow === visitor.visit_id}
              className="bg-white text-orange-600 px-3 py-2 rounded-md text-sm font-medium shadow-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {markingNoShow === visitor.visit_id ? 'Marking...' : 'No Show'}
            </button>
          )}
          {onCheckIn && !visitor.is_checked_in && (
            <button
              onClick={() => onCheckIn(visitor.visit_id)}
              className="bg-white text-green-600 px-3 py-2 rounded-md text-sm font-medium shadow-lg hover:bg-gray-50 transition-colors"
            >
              Check In
            </button>
          )}
          {onCheckOut && visitor.is_checked_in && !visitor.is_checked_out && (
            <button
              onClick={() => onCheckOut(visitor.visit_id)}
              className="bg-white text-gray-600 px-3 py-2 rounded-md text-sm font-medium shadow-lg hover:bg-gray-50 transition-colors"
            >
              Check Out
            </button>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div
        ref={cardRef}
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all duration-200 ${
          isDragging ? 'shadow-lg' : ''
        }`}
        style={{
          transform: `translateX(-${dragDistance}px)`,
          touchAction: 'pan-y'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {getStatusIcon()}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">{visitor.visitor_name}</h3>
                <p className="text-sm text-gray-500">Meeting: {visitor.employee_name}</p>
                <p className="text-xs text-gray-400">
                  Scheduled: {new Date(visitor.scheduled_time).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Swipe Hint */}
        {dragDistance > 0 && dragDistance < SWIPE_THRESHOLD && (
          <div className="mt-2 text-xs text-gray-400 text-center">
            ← Swipe for actions
          </div>
        )}
      </div>
    </div>
  );
};

export default TouchOptimizedCard; 