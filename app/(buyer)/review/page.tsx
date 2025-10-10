/* eslint-disable @typescript-eslint/no-explicit-any */
// app/review/page.tsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { useMyReviews, useMyEligible } from '@/hooks/useReviews';
import { ReviewCard } from '@/components/container/review/ReviewCard';
import ReviewForm from '@/components/container/review/ReviewForm';
import { useMe } from '@/hooks/useSession';
import LogoutConfirm from '@/components/container/account/LogoutConfirm';

type NavItem = { href: string; label: string; icon: string; active: boolean };

export default function MyReviewsPage() {
  const [q, setQ] = useState('');
  const [star, setStar] = useState<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );

  const { data: me } = useMe();

  // hooks: keduanya sudah normalize -> selalu { items, page, limit, total }
  const { data, isLoading, isError, error } = useMyReviews(1, 20, star, q);
  const { data: eligible } = useMyEligible(1, 50);

  // fallback aman agar tidak "undefined properties"
  const items = data?.items ?? [];
  const eligibleItems = (eligible?.items ?? []) as { productId: number }[];

  const nav: NavItem[] = useMemo(
    () => [
      {
        href: '/orders',
        label: 'Order List',
        icon: '/icons/doc.svg',
        active: false,
      },
      {
        href: '/review',
        label: 'Review',
        icon: '/icons/star.svg',
        active: true,
      },
    ],
    []
  );

  // helper unauthorized
  const isUnauthorized = isError && (error as any)?.response?.status === 401;

  return (
    <div className='mx-auto grid max-w-6xl grid-cols-1 gap-6 p-4 md:grid-cols-[260px_1fr]'>
      {/* ===== Left Sidebar ===== */}
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
          <h1 className='text-2xl font-semibold'>Review</h1>

          {eligibleItems.length > 0 && (
            <button
              onClick={() => {
                setOpen(true);
                setSelectedProductId(eligibleItems[0].productId);
              }}
              className='rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90 dark:bg-white dark:text-black'
            >
              + Tulis Review
            </button>
          )}
        </div>

        {/* Unauthorized state */}
        {isUnauthorized && (
          <div className='rounded-2xl border bg-white p-6 text-sm text-red-600 dark:bg-neutral-900'>
            Kamu belum login. Silakan login untuk melihat dan menulis review.
          </div>
        )}

        {/* Search + Filter */}
        {!isUnauthorized && (
          <>
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

            {/* List */}
            <div className='space-y-4'>
              {isLoading && (
                <>
                  <SkeletonCard />
                </> /* tambah lebih banyak kalau mau */
              )}

              {!isLoading && items.length === 0 && (
                <div className='rounded-2xl border bg-white p-8 text-center text-neutral-500 dark:bg-neutral-900'>
                  Belum ada review yang cocok.
                </div>
              )}

              {items.map((r) => (
                <ReviewCard key={r.id} r={r} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Modal */}
      {open && selectedProductId && (
        <div className='fixed inset-0 z-50 grid place-items-center bg-black/40 p-4'>
          <div className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-950'>
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='text-lg cursor-pointer font-semibold'>
                Tulis Review
              </h3>
              <button
                onClick={() => setOpen(true)}
                className='text-neutral-500 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300'
              >
                ✕
              </button>
            </div>
            <ReviewForm
              productId={selectedProductId}
              onDone={() => setOpen(false)}
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
