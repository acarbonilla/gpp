import React, { useEffect, useState } from 'react';
import { ComputerDesktopIcon } from '@heroicons/react/24/outline';

interface KeyboardShortcutsProps {
  onRefresh: () => void;
  onToggleSearch: () => void;
  onToggleFilters: () => void;
  onToggleAnalytics: () => void;
  onToggleNotifications: () => void;
  onExport: () => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onRefresh,
  onToggleSearch,
  onToggleFilters,
  onToggleAnalytics,
  onToggleNotifications,
  onExport
}) => {
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + key combinations
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'r':
            event.preventDefault();
            onRefresh();
            break;
          case 'f':
            event.preventDefault();
            onToggleSearch();
            break;
          case 'e':
            event.preventDefault();
            onExport();
            break;
          case 'a':
            event.preventDefault();
            onToggleAnalytics();
            break;
          case 'n':
            event.preventDefault();
            onToggleNotifications();
            break;
          case '?':
            event.preventDefault();
            setShowShortcuts(!showShortcuts);
            break;
        }
      }

      // Single key shortcuts (when not in input)
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        switch (event.key.toLowerCase()) {
          case 'f':
            if (event.shiftKey) {
              event.preventDefault();
              onToggleFilters();
            }
            break;
          case 'escape':
            setShowShortcuts(false);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onRefresh, onToggleSearch, onToggleFilters, onToggleAnalytics, onToggleNotifications, onExport, showShortcuts]);

  const shortcuts = [
    { key: 'Ctrl + R', description: 'Refresh dashboard' },
    { key: 'Ctrl + F', description: 'Focus search' },
    { key: 'Shift + F', description: 'Toggle filters' },
    { key: 'Ctrl + A', description: 'Toggle analytics' },
    { key: 'Ctrl + N', description: 'Toggle notifications' },
    { key: 'Ctrl + E', description: 'Export report' },
    { key: 'Ctrl + ?', description: 'Show/hide shortcuts' },
    { key: 'Esc', description: 'Close dialogs' },
  ];

  return (
    <>
      {/* Keyboard Shortcuts Button */}
      <button
        onClick={() => setShowShortcuts(!showShortcuts)}
        className="inline-flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        title="Keyboard shortcuts (Ctrl + ?)"
      >
        <ComputerDesktopIcon className="h-4 w-4 mr-1" />
        Shortcuts
      </button>

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{shortcut.description}</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Press <kbd className="px-1 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">Esc</kbd> to close
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyboardShortcuts; 