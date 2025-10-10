// src/components/review/ReviewCard.tsx
import Image from 'next/image';
import StarRating from '@/components/container/review/StarRating';
import type { Review } from '@/types/reviews';

export function ReviewCard({ r }: { r: Review }) {
  return (
    <div className='rounded-2xl border bg-white p-4 shadow-sm dark:bg-neutral-900'>
      <div className='flex items-center gap-2 text-sm text-neutral-500'>
        <span className='tabular-nums'>
          {new Date(r.createdAt).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      <div className='mt-3 flex gap-3'>
        {r.product?.image ? (
          <Image
            src={r.product.image}
            alt={r.product?.name ?? 'product'}
            width={56}
            height={56}
            className='rounded-md object-cover'
          />
        ) : (
          <div className='h-14 w-14 rounded-md bg-neutral-200' />
        )}

        <div className='min-w-0'>
          <div className='text-sm text-neutral-500'>{r.product?.shopName}</div>
          <div className='font-medium'>{r.product?.name}</div>

          <div className='mt-2 flex items-center gap-2'>
            <StarRating value={r.star} readOnly />
            <span className='text-sm tabular-nums text-neutral-600 dark:text-neutral-300'>
              {r.star}.0
            </span>
          </div>

          <p className='mt-2 text-sm text-neutral-700 dark:text-neutral-200'>
            {r.comment}
          </p>

          {r.product && (
            <div className='mt-2 text-xs text-neutral-500'>
              Produk #{r.product.id}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
