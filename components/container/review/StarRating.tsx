'use client';

import { useState } from 'react';

interface StarRatingProps {
  value: number; // current rating (required)
  onChange?: (v: number) => void; // callback untuk set rating (optional)
  size?: number; // ukuran bintang (default 18)
  readOnly?: boolean; // mode non-interaktif
  className?: string; // styling tambahan opsional
}

export default function StarRating({
  value,
  onChange,
  size = 18,
  readOnly = false,
  className = '',
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const displayValue = hover ?? value;

  return (
    <div
      className={`flex items-center gap-1 ${
        readOnly ? '' : 'cursor-pointer'
      } ${className}`}
      aria-label={
        readOnly
          ? `Rating: ${value} dari 5`
          : 'Klik untuk memberi rating antara 1 hingga 5'
      }
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = displayValue >= n;
        return (
          <button
            key={n}
            type='button'
            disabled={readOnly}
            className={`transition-transform duration-150 ${
              readOnly ? 'cursor-default' : 'hover:scale-110 active:scale-95'
            }`}
            aria-label={`rate-${n}`}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(null)}
            onClick={() => !readOnly && onChange?.(n)}
          >
            <svg
              width={size}
              height={size}
              viewBox='0 0 24 24'
              className={`shrink-0 ${
                filled
                  ? 'text-amber-500'
                  : 'text-neutral-300 dark:text-neutral-600'
              }`}
            >
              <path
                d='M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.402 8.17L12 18.897l-7.336 3.869 1.402-8.17L.132 9.21l8.2-1.192L12 .587z'
                fill={filled ? 'currentColor' : 'none'}
                stroke='currentColor'
                strokeWidth='1.5'
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
