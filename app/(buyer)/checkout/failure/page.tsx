// app/checkout/failure/page.tsx
'use client';

import Link from 'next/link';
import Header from '@/components/container/Header';
import Footer from '@/components/container/Footer';

export default function CheckoutFailurePage() {
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
              <circle cx='12' cy='12' r='10' className='fill-rose-100' />
              <path
                d='M9 9l6 6M15 9l-6 6'
                stroke='#E11D48'
                strokeWidth='2'
                strokeLinecap='round'
              />
            </svg>
          </div>

          {/* Title & Sub */}
          <h1 className='text-center text-base font-semibold text-zinc-900'>
            Oops, something went wrong
          </h1>
          <p className='mt-2 max-w-md text-center text-sm text-zinc-500'>
            Something went wrong during checkout. Please review your details and
            retry.
          </p>

          {/* CTA */}
          <div className='mt-6'>
            <Link
              href='/'
              className='inline-flex items-center rounded-xl bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:opacity-90'
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
