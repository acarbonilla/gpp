import React from 'react';

interface SkeletonProps {
  className?: string;
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = "" 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <svg 
          className={`animate-spin ${sizeClasses[size]} text-blue-600 mx-auto`} 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          ></circle>
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        {text && (
          <p className="mt-2 text-sm text-gray-600">{text}</p>
        )}
      </div>
    </div>
  );
};

const PageLoadingSpinner: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <LoadingSpinner size="lg" text={text} />
  </div>
);

const ButtonLoadingSpinner: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="flex items-center">
    <LoadingSpinner size="sm" />
    {text && <span className="ml-2">{text}</span>}
  </div>
);

const StatCardSkeleton: React.FC = () => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <Skeleton className="flex-shrink-0 rounded-md p-3 w-12 h-12" />
        <div className="ml-5 w-0 flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  </div>
);

const QuickActionSkeleton: React.FC = () => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-6">
      <div className="flex items-center">
        <Skeleton className="flex-shrink-0 rounded-md p-3 w-12 h-12" />
        <div className="ml-4 flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  </div>
);

const ActivitySkeleton: React.FC = () => (
  <div className="relative pb-8">
    <div className="relative flex space-x-3">
      <div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
        <div className="flex-1">
          <Skeleton className="h-4 w-48 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  </div>
);

const TableRowSkeleton: React.FC = () => (
  <tr>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="ml-4">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <Skeleton className="h-4 w-20" />
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <Skeleton className="h-4 w-24" />
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <Skeleton className="h-6 w-16 rounded-full" />
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
      <Skeleton className="h-4 w-16 ml-auto" />
    </td>
  </tr>
);

const TableSkeleton: React.FC = () => (
  <div className="bg-white shadow overflow-hidden sm:rounded-md">
    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
      <Skeleton className="h-6 w-48" />
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[...Array(5)].map((_, index) => (
              <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[...Array(5)].map((_, index) => (
            <TableRowSkeleton key={index} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const FormSkeleton: React.FC = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <Skeleton className="h-6 w-32 mb-6" />
    {[...Array(4)].map((_, index) => (
      <div key={index} className="mb-4">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex justify-end space-x-3">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

const CardSkeleton: React.FC = () => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="flex justify-between items-center">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>

    {/* Stats Skeleton */}
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
      {[...Array(5)].map((_, index) => (
        <StatCardSkeleton key={index} />
      ))}
    </div>

    {/* Quick Actions Skeleton */}
    <div>
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[...Array(2)].map((_, index) => (
          <QuickActionSkeleton key={index} />
        ))}
      </div>
    </div>

    {/* Recent Activity Skeleton */}
    <div>
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="bg-white rounded-lg shadow p-6">
        {[...Array(5)].map((_, index) => (
          <ActivitySkeleton key={index} />
        ))}
      </div>
    </div>
  </div>
);

export {
  Skeleton,
  LoadingSpinner,
  PageLoadingSpinner,
  ButtonLoadingSpinner,
  StatCardSkeleton,
  QuickActionSkeleton,
  ActivitySkeleton,
  TableRowSkeleton,
  TableSkeleton,
  FormSkeleton,
  CardSkeleton,
  DashboardSkeleton
}; 