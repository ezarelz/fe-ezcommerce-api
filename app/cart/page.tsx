// app/cart/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart, useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import Header from '@/components/container/Header';
import Footer from '@/components/container/Footer';
import { useState } from 'react';

const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">
      <rect width="100%" height="100%" fill="#f4f4f5"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            fill="#a1a1aa" font-family="Arial, Helvetica, sans-serif" font-size="14">
        No Image
      </text>
    </svg>`
  );

export default function CartPage() {
  const { data, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  // untuk disable tombol per-item saat request berjalan
  const [busyId, setBusyId] = useState<number | null>(null);

  const items = data?.items ?? [];
  const total = data?.grandTotal ?? 0;

  async function inc(it: { id: number; qty: number }) {
    if (!it?.id) return;
    setBusyId(it.id);
    try {
      await updateItem.mutateAsync({ itemId: it.id, qty: it.qty + 1 });
    } finally {
      setBusyId(null);
    }
  }
  async function dec(it: { id: number; qty: number }) {
    if (!it?.id) return;
    const next = (it.qty || 1) - 1;
    setBusyId(it.id);
    try {
      if (next <= 0) {
        await removeItem.mutateAsync(it.id);
      } else {
        await updateItem.mutateAsync({ itemId: it.id, qty: next });
      }
    } finally {
      setBusyId(null);
    }
  }
  async function del(itId: number) {
    if (!itId) return;
    setBusyId(itId);
    try {
      await removeItem.mutateAsync(itId);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <Header />
      <main className='max-w-6xl mx-auto px-3 sm:px-4 py-8 sm:py-12'>
        <h1 className='text-2xl font-bold mb-6'>Cart</h1>

        {isLoading ? (
          <p>Loading cart…</p>
        ) : items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* list */}
            <div className='lg:col-span-2 space-y-4'>
              {items.map((it) => {
                const isBusy =
                  busyId === it.id ||
                  updateItem.isPending ||
                  removeItem.isPending;

                return (
                  <div key={it.id} className='rounded-xl border p-4'>
                    {/* header row brand & price kanan */}
                    <div className='mb-3 flex items-center justify-between text-sm text-zinc-700'>
                      <div className='flex items-center gap-2'>
                        <span className='inline-block h-4 w-4 rounded-full bg-zinc-900' />
                        <span className='font-medium'>Toko</span>
                      </div>
                      <div className='font-semibold'>
                        {formatIDR(Number(it.price || 0) * Number(it.qty || 0))}
                      </div>
                    </div>

                    {/* content */}
                    <div className='flex items-center gap-4'>
                      <div className='relative w-20 h-20 rounded-md overflow-hidden bg-zinc-100'>
                        <Image
                          src={it.image || FALLBACK_IMG}
                          alt={it.title || 'Product'}
                          fill
                          className='object-cover'
                        />
                      </div>

                      <div className='flex-1 min-w-0'>
                        <div className='font-medium truncate'>
                          {it.title || 'Product'}
                        </div>
                        <div className='text-xs text-zinc-600 mt-0.5'>
                          SKU • Apparel
                        </div>
                      </div>

                      {/* actions: trash + stepper */}
                      <button
                        className='inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-zinc-50 cursor-pointer'
                        aria-label='remove'
                        disabled={isBusy}
                        onClick={() => del(it.id)}
                        title='Remove item'
                      >
                        <Image
                          src='/icons/trash-ico.svg'
                          alt='Remove'
                          width={18}
                          height={18}
                        />
                      </button>

                      <div className='inline-flex items-center rounded-lg border'>
                        <button
                          className='px-3 py-2 cursor-pointer disabled:opacity-50'
                          aria-label='decrease'
                          disabled={isBusy || (it.qty ?? 1) <= 1}
                          onClick={() => dec({ id: it.id, qty: it.qty })}
                        >
                          −
                        </button>
                        <div className='px-4 py-2 min-w-10 text-center text-sm'>
                          {Number(it.qty) || 0}
                        </div>
                        <button
                          className='px-3 py-2 cursor-pointer disabled:opacity-50'
                          aria-label='increase'
                          disabled={isBusy}
                          onClick={() => inc({ id: it.id, qty: it.qty })}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* summary */}
            <aside className='rounded-xl border p-4 h-fit'>
              <h2 className='font-semibold mb-3'>Total Shopping</h2>
              <div className='flex items-center justify-between text-sm mb-4'>
                <span>Total</span>
                <span className='font-semibold'>{formatIDR(total)}</span>
              </div>
              <Button className='w-full'>Checkout</Button>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function EmptyCart() {
  return (
    <div className='text-center py-20'>
      <Image
        src='/icons/empty-cart.svg'
        alt='Empty cart'
        width={160}
        height={160}
        className='mx-auto mb-6'
      />
      <h2 className='text-lg font-semibold mb-2'>Your Cart is Empty</h2>
      <p className='text-zinc-600 mb-6'>
        Your cart is waiting. Add your favorite items and come back to checkout.
      </p>
      <Link href='/products'>
        <Button variant='brand'>Start Shopping</Button>
      </Link>
    </div>
  );
}

function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}
