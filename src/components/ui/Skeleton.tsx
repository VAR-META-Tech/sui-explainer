'use client';

import { cn } from '@/lib/utils';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };
  
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        variantStyles[variant],
        className
      )}
      style={{
        width: width,
        height: height || (variant === 'text' ? '1em' : undefined),
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={16} />
        </div>
      </div>
      <div className="space-y-3 mt-4">
        <Skeleton width="100%" height={16} />
        <Skeleton width="80%" height={16} />
        <Skeleton width="90%" height={16} />
      </div>
    </div>
  );
}

export function SkeletonTransactionDetails() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton width={120} height={24} />
        <Skeleton width={80} height={24} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton width="100%" height={80} />
        <Skeleton width="100%" height={80} />
      </div>
      <Skeleton width="100%" height={60} />
    </div>
  );
}
