import React, { useState } from 'react';
import { CheckIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface BulkActionsProps {
  visitors: any[];
  onBulkNoShow: (visitIds: number[]) => void;
  onBulkCheckIn?: (visitIds: number[]) => void;
  onBulkCheckOut?: (visitIds: number[]) => void;
  markingNoShow: number | null;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  visitors,
  onBulkNoShow,
  onBulkCheckIn,
  onBulkCheckOut,
  markingNoShow
}) => {
  const [selectedVisitors, setSelectedVisitors] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const eligibleForNoShow = visitors.filter(v => {
    const nowUTC = new Date();
    const scheduledUTC = new Date(v.scheduled_time);
    const timeDiff = nowUTC.getTime() - scheduledUTC.getTime();
    const minutesLate = timeDiff / (1000 * 60);
    return !v.is_checked_in && v.status === 'approved' && minutesLate >= 15;
  });

  const eligibleForCheckIn = visitors.filter(v => !v.is_checked_in && v.status === 'approved');
  const eligibleForCheckOut = visitors.filter(v => v.is_checked_in && !v.is_checked_out);

  const toggleVisitorSelection = (visitId: number) => {
    const newSelected = new Set(selectedVisitors);
    if (newSelected.has(visitId)) {
      newSelected.delete(visitId);
    } else {
      newSelected.add(visitId);
    }
    setSelectedVisitors(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAll = () => {
    const allIds = new Set(visitors.map(v => v.visit_id));
    setSelectedVisitors(allIds);
    setShowBulkActions(true);
  };

  const clearSelection = () => {
    setSelectedVisitors(new Set());
    setShowBulkActions(false);
  };

  const handleBulkNoShow = () => {
    const selectedIds = Array.from(selectedVisitors);
    onBulkNoShow(selectedIds);
    clearSelection();
  };

  const handleBulkCheckIn = () => {
    if (onBulkCheckIn) {
      const selectedIds = Array.from(selectedVisitors);
      onBulkCheckIn(selectedIds);
      clearSelection();
    }
  };

  const handleBulkCheckOut = () => {
    if (onBulkCheckOut) {
      const selectedIds = Array.from(selectedVisitors);
      onBulkCheckOut(selectedIds);
      clearSelection();
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={selectAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Select All ({visitors.length})
          </button>
          {selectedVisitors.size > 0 && (
            <button
              onClick={clearSelection}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Selection
            </button>
          )}
        </div>
        
        {selectedVisitors.size > 0 && (
          <div className="text-sm text-gray-600">
            {selectedVisitors.size} visitor{selectedVisitors.size !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* Bulk Action Buttons */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-900">
                Bulk Actions ({selectedVisitors.size} selected)
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {eligibleForNoShow.some(v => selectedVisitors.has(v.visit_id)) && (
                <button
                  onClick={handleBulkNoShow}
                  disabled={markingNoShow !== null}
                  className="inline-flex items-center px-3 py-1.5 border border-orange-300 shadow-sm text-xs font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  Mark No Show
                </button>
              )}
              
              {onBulkCheckIn && eligibleForCheckIn.some(v => selectedVisitors.has(v.visit_id)) && (
                <button
                  onClick={handleBulkCheckIn}
                  className="inline-flex items-center px-3 py-1.5 border border-green-300 shadow-sm text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Check In
                </button>
              )}
              
              {onBulkCheckOut && eligibleForCheckOut.some(v => selectedVisitors.has(v.visit_id)) && (
                <button
                  onClick={handleBulkCheckOut}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Check Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Visitor List with Checkboxes */}
      <div className="space-y-2">
        {visitors.map((visitor) => (
          <div
            key={visitor.visit_id}
            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
              selectedVisitors.has(visitor.visit_id)
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedVisitors.has(visitor.visit_id)}
              onChange={() => toggleVisitorSelection(visitor.visit_id)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {visitor.is_checked_in && !visitor.is_checked_out ? (
                    <CheckIcon className="h-5 w-5 text-green-500" />
                  ) : visitor.is_checked_out ? (
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  ) : visitor.status === 'no_show' ? (
                    <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-yellow-500"></div>
                  )}
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
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                visitor.is_checked_in && !visitor.is_checked_out
                  ? 'bg-green-100 text-green-800'
                  : visitor.is_checked_out
                  ? 'bg-gray-100 text-gray-800'
                  : visitor.status === 'no_show'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {visitor.is_checked_in && !visitor.is_checked_out
                  ? 'Checked In'
                  : visitor.is_checked_out
                  ? 'Checked Out'
                  : visitor.status === 'no_show'
                  ? 'No Show'
                  : 'Pending'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BulkActions; 