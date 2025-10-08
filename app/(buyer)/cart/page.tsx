// app/cart/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo, useCallback } from 'react';
import Header from '@/components/container/Header';
import Footer from '@/components/container/Footer';
import { Button } from '@/components/ui/button';
import { useCartHydrated } from '@/hooks/useCartHydrated';
import { useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart';
import type { CartItem } from '@/types/cart';
import {
  getProductTitle,
  getProductImage,
  getShopName,
  getShopSlug,
  calcCartTotal,
  calcLineTotal,
} from '@/types/cart';

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

function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

export default function CartPage() {
  const { data, isLoading, isError } = useCartHydrated();
  const updateQty = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const [busyId, setBusyId] = useState<string | number | null>(null);

  // Stabilkan items & total
  const items: CartItem[] = useMemo(() => data?.items ?? [], [data?.items]);
  const total = useMemo(() => calcCartTotal(items), [items]);

  // Precompute nilai turunan per-row (mengurangi kerja di render loop)
  const rows = useMemo(
    () =>
      items.map((it) => {
        const title = getProductTitle(it.product);
        const img = getProductImage(it.product) ?? FALLBACK_IMG;
        const shopName = getShopName(it.product);
        const shopSlug = getShopSlug(it.product);
        const lineTotal = calcLineTotal(it);
        const unitPrice = lineTotal / Math.max(1, it.quantity ?? 1);
        return {
          item: it,
          id: String(it.id),
          qty: it.quantity,
          title,
          img,
          shopName,
          shopSlug,
          lineTotal,
          unitPrice,
        };
      }),
    [items]
  );

  // Stabilkan handler supaya referensi tidak berubah-ubah
  const inc = useCallback(
    async (id: string | number, qty: number) => {
      setBusyId(id);
      try {
        await updateQty.mutateAsync({
          cartItemId: String(id),
          quantity: (qty ?? 1) + 1,
        });
      } finally {
        setBusyId(null);
      }
    },
    [updateQty]
  );

  const dec = useCallback(
    async (id: string | number, qty: number) => {
      setBusyId(id);
      const next = (qty ?? 1) - 1;
      try {
        if (next <= 0) {
          await removeItem.mutateAsync({ cartItemId: String(id) });
        } else {
          await updateQty.mutateAsync({
            cartItemId: String(id),
            quantity: next,
          });
        }
      } finally {
        setBusyId(null);
      }
    },
    [removeItem, updateQty]
  );

  const del = useCallback(
    async (id: string | number) => {
      setBusyId(id);
      try {
        await removeItem.mutateAsync({ cartItemId: String(id) });
      } finally {
        setBusyId(null);
      }
    },
    [removeItem]
  );

  return (
    <>
      <Header />
      <main className='max-w-6xl mx-auto px-3 sm:px-4 py-8 sm:py-12'>
        <h1 className='text-2xl font-bold mb-6'>Cart</h1>

        {isLoading ? (
          <p>Loading cart…</p>
        ) : isError ? (
          <p className='text-red-600'>Gagal memuat keranjang.</p>
        ) : items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-2 space-y-4'>
              {rows.map((row) => {
                const isBusy =
                  busyId === row.id ||
                  updateQty.isPending ||
                  removeItem.isPending;

                return (
                  <div key={row.id} className='rounded-xl border p-4'>
                    {/* shop & line total */}
                    <div className='mb-3 flex items-center justify-between text-sm text-zinc-700'>
                      <div className='flex items-center gap-2'>
                        <span className='inline-block h-4 w-4 rounded-full bg-zinc-900' />
                        {row.shopSlug ? (
                          <Link
                            href={`/shops/${row.shopSlug}`}
                            className='font-medium hover:underline'
                          >
                            {row.shopName}
                          </Link>
                        ) : (
                          <span className='font-medium'>{row.shopName}</span>
                        )}
                      </div>
                      <div className='font-semibold'>
                        {formatIDR(row.lineTotal)}
                      </div>
                    </div>

                    {/* product row */}
                    <div className='flex items-center gap-4'>
                      <div className='relative w-20 h-20 rounded-md overflow-hidden bg-zinc-100'>
                        <Image
                          src={row.img}
                          alt={row.title}
                          fill
                          className='object-cover'
                        />
                      </div>

                      <div className='flex-1 min-w-0'>
                        <div className='font-medium truncate'>{row.title}</div>
                        <div className='text-xs text-zinc-600 mt-0.5'>
                          {formatIDR(row.unitPrice)}
                        </div>
                      </div>

                      {/* remove */}
                      <button
                        className='inline-flex h-9 w-9 items-center justify-center rounded-md border cursor-pointer hover:bg-zinc-50'
                        disabled={isBusy}
                        onClick={() => del(row.id)}
                        aria-label='remove'
                      >
                        <Image
                          src='/icons/trash-ico.svg'
                          alt='Remove'
                          width={18}
                          height={18}
                        />
                      </button>

                      {/* qty stepper */}
                      <div className='inline-flex items-center rounded-lg border'>
                        <button
                          className='px-3 py-2 cursor-pointer disabled:opacity-50'
                          disabled={isBusy || (row.qty ?? 1) <= 1}
                          onClick={() => dec(row.id, row.qty)}
                          aria-label='decrease'
                        >
                          −
                        </button>
                        <div className='px-4 py-2 min-w-10 text-center text-sm'>
                          {row.qty}
                        </div>
                        <button
                          className='px-3 py-2 cursor-pointer disabled:opacity-50'
                          disabled={isBusy}
                          onClick={() => inc(row.id, row.qty)}
                          aria-label='increase'
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
              <Link href='/checkout'>
                <Button className='w-full'>Checkout</Button>
              </Link>
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
