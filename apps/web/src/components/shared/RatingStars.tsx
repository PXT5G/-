'use client';

import { cn } from '@/utils/cn';

interface RatingStarsProps {
  rating: number;
  size?: 'sm' | 'md';
  showValue?: boolean;
  count?: number;
}

export function RatingStars({ rating, size = 'sm', showValue, count }: RatingStarsProps) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={cn('flex items-center gap-1', textSize)}>
      {stars.map((star) => (
        <span key={star} className={star <= Math.round(rating) ? 'text-banana-gold' : 'text-white/20'}>
          ★
        </span>
      ))}
      {showValue && <span className="text-white/60 ml-1">{rating.toFixed(1)}</span>}
      {count !== undefined && <span className="text-white/40">({count.toLocaleString()})</span>}
    </div>
  );
}
