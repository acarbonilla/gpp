import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

const StatCardSkeleton: React.FC = () => (
  <div className="bg-white border-b-4 border-gray-300 rounded-lg shadow flex items-center p-5">
    <div className="flex-shrink-0 rounded-md p-3 bg-gray-300">
      <Skeleton className="h-6 w-6" />
    </div>
    <div className="ml-5 w-0 flex-1">
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-8 w-12" />
    </div>
  </div>
);

const QuickActionSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-lg shadow">
    <div className="flex items-center">
      <Skeleton className="h-12 w-12 rounded-lg mr-4" />
      <div className="flex-1">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  </div>
);

const ActivitySkeleton: React.FC = () => (
  <div className="flex items-center space-x-3 py-3">
    <Skeleton className="h-8 w-8 rounded-full" />
    <div className="flex-1">
      <Skeleton className="h-4 w-32 mb-1" />
      <Skeleton className="h-3 w-24" />
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

export { Skeleton, StatCardSkeleton, QuickActionSkeleton, ActivitySkeleton, DashboardSkeleton }; 