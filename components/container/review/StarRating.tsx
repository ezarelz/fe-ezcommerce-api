// src/components/review/StarRating.tsx
'use client';
import { useState } from 'react';

export default function StarRating({
  value = 0,
  onChange,
  size = 18,
  readOnly = false,
}: {
  value?: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState<number>(0);
  const display = hover || value;

  return (
    <div className='flex items-center gap-1'>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type='button'
          className='p-0'
          aria-label={`rate-${n}`}
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onChange?.(n)}
        >
          <svg
            width={size}
            height={size}
            viewBox='0 0 24 24'
            className='shrink-0'
          >
            <path
              d='M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.402 8.17L12 18.897l-7.336 3.869 1.402-8.17L.132 9.21l8.2-1.192L12 .587z'
              fill={display >= n ? 'currentColor' : 'none'}
              stroke='currentColor'
              strokeWidth='1.5'
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
