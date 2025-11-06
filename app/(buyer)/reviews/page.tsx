/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMyReviews, useMyEligible } from '@/hooks/useReviews';
import ReviewForm from '@/components/container/review/ReviewForm';
import { useMe } from '@/hooks/useSession';
import LogoutConfirm from '@/components/container/account/LogoutConfirm';
import type { Review, Eligible } from '@/types/reviews';

type NavItem = { href: string; label: string; icon: string; active: boolean };

export default function MyReviewsPage() {
  const [q, setQ] = useState('');
  const [star, setStar] = useState<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );

  const { data: me } = useMe();
  const { data, isLoading, isError, error, refetch } = useMyReviews(
    1,
    20,
    star,
    q
  );
  const { data: eligible } = useMyEligible(1, 50);

  const items = (data?.items ?? []) as Review[];
  const eligibleItems = (eligible?.items ?? []) as Eligible[];
  const isUnauthorized = isError && (error as any)?.response?.status === 401;

  const nav: NavItem[] = useMemo(
    () => [
      {
        href: '/orders',
        label: 'Order List',
        icon: '/icons/doc.svg',
        active: false,
      },
      {
        href: '/reviews',
        label: 'Reviews',
        icon: '/icons/star.svg',
        active: true,
      },
    ],
    []
  );

  return (
    <div className='mx-auto grid max-w-6xl grid-cols-1 gap-6 p-4 md:grid-cols-[260px_1fr]'>
      {/* ===== Sidebar ===== */}
      <aside className='self-start rounded-2xl border bg-white p-4 shadow-sm dark:bg-neutral-900'>
        <div className='flex items-center gap-3'>
          {me?.avatarUrl ? (
            <Image
              src={me.avatarUrl}
              alt={me?.name ?? 'User'}
              width={48}
              height={48}
              className='rounded-full object-cover'
            />
          ) : (
            <div className='h-12 w-12 rounded-full bg-neutral-200' />
          )}
          <div>
            <div className='font-medium'>{me?.name ?? 'John Doe'}</div>
            <div className='text-xs text-neutral-500'>
              {me?.email ?? 'john@doe.com'}
            </div>
          </div>
        </div>

        <nav className='mt-4 space-y-1'>
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={[
                'flex items-center gap-2 rounded-xl px-3 py-2 text-sm',
                n.active
                  ? 'bg-neutral-100 font-medium dark:bg-neutral-800'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/70',
              ].join(' ')}
            >
              <Image src={n.icon} alt='' width={16} height={16} />
              {n.label}
            </Link>
          ))}
        </nav>

        <div className='mt-4 border-t pt-4'>
          <LogoutConfirm redirectTo='/'>
            <button
              type='button'
              className='flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800'
            >
              <Image src='/icons/logout.svg' alt='' width={16} height={16} />
              Logout
            </button>
          </LogoutConfirm>
        </div>
      </aside>

      {/* ===== Right Content ===== */}
      <section className='rounded-2xl'>
        <div className='mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center'>
          <h1 className='text-2xl font-semibold'>Reviews</h1>
        </div>

        {isUnauthorized ? (
          <div className='rounded-2xl border bg-white p-6 text-sm text-red-600 dark:bg-neutral-900'>
            Kamu belum login. Silakan login untuk melihat dan menulis review.
          </div>
        ) : (
          <>
            {/* Filter */}
            <div className='mb-4 flex flex-col gap-2 sm:flex-row'>
              <div className='relative flex-1'>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder='Search'
                  className='w-full rounded-full border pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-black/10 dark:bg-neutral-900'
                />
                <svg
                  viewBox='0 0 24 24'
                  className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                >
                  <circle cx='11' cy='11' r='7' />
                  <path d='m20 20-3.5-3.5' />
                </svg>
              </div>

              <select
                value={star ?? ''}
                onChange={(e) =>
                  setStar(e.target.value ? Number(e.target.value) : undefined)
                }
                className='rounded-full border px-3 py-2'
              >
                <option value=''>All rating</option>
                {[5, 4, 3, 2, 1].map((s) => (
                  <option key={s} value={s}>
                    {s} ★
                  </option>
                ))}
              </select>
            </div>

            {/* ===== Sudah Direview ===== */}
            <div className='space-y-2'>
              {isLoading && <SkeletonCard />}
              {!isLoading &&
                items.map((r) => (
                  <div
                    key={r.id}
                    className='group flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800'
                  >
                    {/* Gambar produk */}
                    <div className='size-14 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100'>
                      <Image
                        src={r.product?.images?.[0] || '/placeholder.png'}
                        alt={r.product?.title || 'Product'}
                        width={56}
                        height={56}
                        className='h-14 w-14 object-cover'
                      />
                    </div>

                    {/* Detail */}
                    <div className='flex flex-1 flex-col'>
                      <span className='font-medium text-neutral-800 dark:text-neutral-100'>
                        {r.product?.title ?? 'Unknown Product'}
                      </span>
                      <span className='text-xs text-neutral-500'>
                        {r.product?.shop?.name ?? 'Unknown Shop'}
                      </span>
                      <div className='flex items-center gap-1 text-yellow-500'>
                        {[...Array(r.rating ?? 0)].map((_, i) => (
                          <svg
                            key={i}
                            xmlns='http://www.w3.org/2000/svg'
                            viewBox='0 0 20 20'
                            fill='currentColor'
                            className='h-4 w-4'
                          >
                            <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.157 3.564a1 1 0 00.95.69h3.741c.969 0 1.371 1.24.588 1.81l-3.028 2.204a1 1 0 00-.364 1.118l1.157 3.564c.3.921-.755 1.688-1.54 1.118L10 13.347l-3.612 2.648c-.784.57-1.838-.197-1.54-1.118l1.157-3.564a1 1 0 00-.364-1.118L2.613 9.061c-.783-.57-.38-1.81.588-1.81h3.741a1 1 0 00.95-.69l1.157-3.564z' />
                          </svg>
                        ))}
                      </div>
                      <p className='mt-1 text-sm text-neutral-700 dark:text-neutral-300'>
                        {r.comment || '(Tanpa komentar)'}
                      </p>
                      <p className='mt-1 text-xs text-neutral-500'>
                        {new Date(r.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            {/* ===== Belum Direview ===== */}
            {eligibleItems.length > 0 && (
              <div className='pt-6'>
                <h3 className='mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400'>
                  Produk yang bisa direview:
                </h3>
                <div className='space-y-2'>
                  {eligibleItems.map((p) => (
                    <button
                      key={p.productId}
                      onClick={() => {
                        setSelectedProductId(p.productId);
                        setOpen(true);
                      }}
                      className='group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800'
                    >
                      <div className='size-14 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100'>
                        <Image
                          src={p.images?.[0] || '/placeholder.png'}
                          alt={p.name}
                          width={56}
                          height={56}
                          className='h-14 w-14 object-cover'
                        />
                      </div>
                      <div className='flex flex-1 flex-col'>
                        <span className='font-medium text-neutral-800 dark:text-neutral-100'>
                          {p.name}
                        </span>
                        {p.shop?.name && (
                          <span className='text-xs text-neutral-500'>
                            {p.shop.name}
                          </span>
                        )}
                        {p.price && (
                          <span className='text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                            Rp{p.price.toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                      <div className='flex items-center gap-1 text-neutral-400 transition group-hover:text-black dark:group-hover:text-white'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 24 24'
                          strokeWidth='1.8'
                          stroke='currentColor'
                          className='h-5 w-5'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            d='M12 4v16m8-8H4'
                          />
                        </svg>
                        <span className='text-xs font-medium'>
                          Tulis Review
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ===== Modal ===== */}
      {open && selectedProductId && (
        <div className='fixed inset-0 z-50 grid place-items-center bg-black/40 p-4'>
          <div className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-950'>
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='text-lg font-semibold'>Tulis Review</h3>
              <button
                onClick={() => setOpen(false)}
                className='text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              >
                ✕
              </button>
            </div>
            <ReviewForm
              productId={selectedProductId}
              onClose={() => setOpen(false)}
              onSuccess={() => {
                setOpen(false);
                refetch();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* Skeleton */
function SkeletonCard() {
  return (
    <div className='animate-pulse rounded-2xl border bg-white p-4 shadow-sm dark:bg-neutral-900'>
      <div className='h-4 w-40 rounded bg-neutral-200 dark:bg-neutral-800' />
      <div className='mt-3 flex gap-3'>
        <div className='h-14 w-14 rounded-md bg-neutral-200 dark:bg-neutral-800' />
        <div className='flex-1 space-y-2'>
          <div className='h-4 w-56 rounded bg-neutral-200 dark:bg-neutral-800' />
          <div className='h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-800' />
          <div className='h-4 w-full rounded bg-neutral-200 dark:bg-neutral-800' />
        </div>
      </div>
    </div>
  );
}
