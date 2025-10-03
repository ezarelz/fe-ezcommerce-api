// app/cart/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import Header from '@/components/container/Header';
import Footer from '@/components/container/Footer';

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
  // useCart mengembalikan UseQueryResult<Cart>, jadi ambil data & isLoading
  const { data, isLoading } = useCart();

  const items = data?.items ?? [];
  const total = items.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0),
    0
  );

  return (
    <>
      <Header />
      <main className='max-w-6xl mx-auto px-3 sm:px-4 py-8 sm:py-12'>
        <h1 className='text-2xl font-bold mb-6'>Cart</h1>

        {isLoading ? (
          <p>Loading cart…</p>
        ) : items.length === 0 ? (
          <div className='text-center py-20'>
            <Image
              src='/icons/empty-cart.svg'
              alt='Empty cart'
              width={120}
              height={120}
              className='mx-auto mb-6'
            />
            <h2 className='text-lg font-semibold mb-2'>Your Cart is Empty</h2>
            <p className='text-zinc-600 mb-6'>
              Your cart is waiting. Add your favorite items and come back to
              checkout.
            </p>
            <Link href='/products'>
              <Button variant='brand'>Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-2 space-y-4'>
              {items.map((it) => (
                <div
                  key={it.id ?? `${it.productId}-${it.qty}`}
                  className='flex items-center gap-4 border rounded-lg p-4'
                >
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
                    <div className='text-sm text-zinc-600'>
                      {formatIDR(Number(it.price) || 0)}
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <button className='px-2' aria-label='decrease'>
                      −
                    </button>
                    <span>{Number(it.qty) || 0}</span>
                    <button className='px-2' aria-label='increase'>
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className='border rounded-lg p-4 h-fit'>
              <h2 className='font-semibold mb-4'>Total Shopping</h2>
              <div className='flex justify-between mb-4'>
                <span>Total</span>
                <span className='font-semibold'>{formatIDR(total)}</span>
              </div>
              <Button className='w-full'>Checkout</Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}
