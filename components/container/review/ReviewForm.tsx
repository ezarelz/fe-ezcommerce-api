'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import StarRating from './StarRating';

interface ReviewFormProps {
  productId: number;
  productName?: string;
  open?: boolean; // dibuat optional supaya bisa dipakai tanpa modal wrapper
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function ReviewForm({
  productId,
  productName,
  open = true,
  onClose,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) {
      alert('Pilih rating terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      await api('/api/reviews', {
        method: 'POST',
        useAuth: true,
        data: { productId, rating, comment },
      });

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim review.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
      role='dialog'
      aria-modal='true'
    >
      <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900'>
        {/* Header */}
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-lg font-semibold'>Give Review</h3>
          <button
            type='button'
            onClick={onClose}
            className='rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {productName && (
            <p className='mb-2 text-sm text-neutral-600 dark:text-neutral-300'>
              {productName}
            </p>
          )}

          <div className='mb-3 flex justify-center'>
            <StarRating
              value={rating}
              onChange={(v: number) => setRating(v)}
              readOnly={false}
            />
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder='Tulis review kamu di sini...'
            className='w-full rounded-xl border px-3 py-2 text-sm dark:bg-neutral-800'
          />

          <button
            type='submit'
            disabled={loading}
            className='mt-4 w-full rounded-xl bg-black px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black'
          >
            {loading ? 'Mengirim...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
