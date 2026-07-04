'use client';

interface LoadingSkeletonProps {
  rows?: number;
  height?: string;
  className?: string;
}

export function LoadingSkeleton({ rows = 3, height = 'h-16', className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`flex flex-col gap-3 p-4 animate-pulse ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={`${height} bg-white/5 rounded-2xl`} />
      ))}
    </div>
  );
}
