'use client';

import Image from 'next/image';
import StarRating from './StarRating';

interface ReviewCardProps {
  productName?: string;
  productImage?: string;
  rating: number;
  comment: string;
  date?: string;
}

export default function ReviewCard({
  productName,
  productImage,
  rating,
  comment,
  date,
}: ReviewCardProps) {
  return (
    <div className='rounded-2xl border p-4 dark:border-neutral-800'>
      <div className='flex items-start gap-3'>
        {productImage && (
          <Image
            src={productImage}
            alt={productName || 'product'}
            width={64}
            height={64}
            className='rounded object-cover'
          />
        )}
        <div className='flex-1'>
          {productName && (
            <h3 className='mb-1 text-sm font-medium'>{productName}</h3>
          )}
          <StarRating value={rating} readOnly />
          <p className='mt-1 text-sm text-neutral-700 dark:text-neutral-300'>
            {comment}
          </p>
          {date && (
            <p className='mt-1 text-xs text-neutral-500'>
              {new Date(date).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
