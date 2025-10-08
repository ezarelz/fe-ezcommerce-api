// app/checkout/success/page.tsx
'use client';

import Link from 'next/link';
import Header from '@/components/container/Header';
import Footer from '@/components/container/Footer';

export default function CheckoutSuccessPage() {
  return (
    <>
      <Header />
      <main className='min-h-[70vh] bg-white'>
        <div className='mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-16'>
          {/* Badge */}
          <div className='mb-6 rounded-full bg-zinc-100 p-8'>
            <svg
              width='56'
              height='56'
              viewBox='0 0 24 24'
              fill='none'
              aria-hidden
            >
              <circle cx='12' cy='12' r='10' className='fill-green-100' />
              <path
                d='M8.5 12.5l2.3 2.3 4.7-5.3'
                stroke='#16A34A'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>

          {/* Title & Sub */}
          <h1 className='text-center text-base font-semibold text-zinc-900'>
            Order Placed Successfully!
          </h1>
          <p className='mt-2 max-w-md text-center text-sm text-zinc-500'>
            We’ve received your order and will notify you once it’s shipped.
          </p>

          {/* CTA */}
          <div className='mt-6'>
            <Link
              href='/orders'
              className='inline-flex items-center rounded-xl bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:opacity-90'
            >
              Go to My Orders
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
