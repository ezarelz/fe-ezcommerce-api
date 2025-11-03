'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

/* ====================== Types ====================== */
type ApiResp<T> = { success: boolean; message: string; data: T };

/* ====================== Hook ====================== */
export function useCompleteOrderItem() {
  return useMutation({
    mutationFn: async (itemId: number) => {
      return api<ApiResp<unknown>>(`/api/orders/items/${itemId}/complete`, {
        method: 'PATCH',
        useAuth: true,
      });
    },
  });
}

/* ====================== Modal Component ====================== */
export function CompleteButton({
  itemId,
  disabled,
  onDone,
}: {
  itemId: number;
  disabled?: boolean;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCompleteOrderItem();

  return (
    <>
      <button
        disabled={disabled}
        onClick={() => setOpen(true)}
        className='rounded-lg bg-emerald-700 px-3 py-1 text-xs text-white hover:bg-emerald-800 disabled:opacity-50'
      >
        Confirm Received
      </button>

      {open && (
        <div className='fixed inset-0 z-50 grid place-items-center bg-black/40'>
          <div className='w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg'>
            <div className='mb-2  font-semibold'>Confirm Item Received</div>
            <p className='mb-3  text-sm text-zinc-600'>
              Are You Sure to Receive the item in Good Condition and Complete
              Order?
            </p>

            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setOpen(false)}
                className='rounded-lg px-3 py-1.5 text-sm'
              >
                Disregard
              </button>
              <button
                onClick={() =>
                  mutate(itemId, {
                    onSuccess: () => {
                      setOpen(false);
                      onDone?.();
                    },
                    onError: (err) => {
                      alert(
                        (err as Error)?.message ??
                          'Failed to mark item as complete.'
                      );
                    },
                  })
                }
                disabled={isPending}
                className='rounded-lg bg-emerald-700 px-3 py-1.5 text-sm text-white disabled:opacity-50'
              >
                {isPending ? 'Saving…' : 'Yes, Received'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
