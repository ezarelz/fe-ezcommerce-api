// src/components/review/ReviewForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import StarRating from '@/components/container/review/StarRating';
import { ReviewSchema, ReviewValues } from '@/validator/review';
import { useCreateOrUpdateReview } from '@/hooks/useReviews';

export default function ReviewForm({
  productId,
  onDone,
}: {
  productId: number;
  onDone?: () => void;
}) {
  const [star, setStar] = useState(5);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ReviewValues>({
    resolver: zodResolver(ReviewSchema),
    defaultValues: { star: 5, comment: '' },
  });

  const { mutateAsync, isPending } = useCreateOrUpdateReview(productId);

  const submit = handleSubmit(async (values) => {
    await mutateAsync(values); // { star, comment }
    onDone?.();
  });

  return (
    <form onSubmit={submit} className='space-y-4'>
      <div>
        <label className='text-sm font-medium'>Rating</label>
        <div className='mt-2'>
          <StarRating
            value={star}
            onChange={(v) => {
              setStar(v);
              setValue('star', v, { shouldValidate: true });
            }}
          />
        </div>
        {errors.star && (
          <p className='mt-1 text-xs text-red-500'>{errors.star.message}</p>
        )}
      </div>

      <div>
        <label className='text-sm font-medium'>Komentar</label>
        <textarea
          {...register('comment')}
          rows={4}
          placeholder='Bagikan pengalamanmu…'
          className='mt-2 w-full resize-none rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 dark:bg-neutral-900'
        />
        {errors.comment && (
          <p className='mt-1 text-xs text-red-500'>{errors.comment.message}</p>
        )}
      </div>

      <button
        type='submit'
        disabled={isSubmitting || isPending}
        className='rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black'
      >
        {isSubmitting || isPending ? 'Mengirim…' : 'Kirim Review'}
      </button>
    </form>
  );
}
