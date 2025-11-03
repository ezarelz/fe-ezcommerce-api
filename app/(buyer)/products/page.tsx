// app/(buyer)/products/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { InfiniteData } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProductsInfinite } from '@/hooks/useProducts';
import type {
  ApiProduct,
  ApiProductsResponse,
  ProductCardVM,
} from '@/types/products';
import { toProductCardVM } from '@/lib/transform';
import Header from '@/components/container/Header';
import Footer from '@/components/container/Footer';

/* =========================
   Helper: fallback image URL
========================= */
function safeImageSrc(url?: string): string {
  if (!url || url.trim() === '' || url.trim().toLowerCase() === 'string') {
    return '/placeholder.png';
  }
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  if (url.startsWith('/')) return url;
  const base =
    process.env.NEXT_PUBLIC_CDN_BASE ||
    process.env.NEXT_PUBLIC_API_ORIGIN ||
    '';
  const normalized = url.replace(/^\.?\//, '');
  return base ? `${base}/${normalized}` : `/${normalized}`;
}

/* =========================
   Skeleton Card
========================= */
function CardSkeleton() {
  return (
    <div className='rounded-xl border border-zinc-200 bg-white shadow-sm'>
      <div className='relative w-full'>
        <Skeleton className='w-full' style={{ paddingTop: '100%' }} />
      </div>
      <div className='p-4 space-y-2'>
        <Skeleton className='h-4 w-3/4' />
        <Skeleton className='h-4 w-1/3' />
      </div>
    </div>
  );
}

/* =========================
   Page Component
========================= */
export default function ProductsPage() {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProductsInfinite(20);

  // flatten data
  type ProductsInfiniteData = InfiniteData<ApiProductsResponse> & {
    items: ApiProduct[];
  };

  const items: ApiProduct[] =
    (data as ProductsInfiniteData | undefined)?.items ?? [];
  const cards: ProductCardVM[] = items.map(toProductCardVM);

  return (
    <>
      <Header />
      <main className='max-w-6xl mx-auto px-3 sm:px-4 py-8 sm:py-12'>
        <h1 className='text-2xl sm:text-3xl font-bold mb-6'>All Products</h1>

        {/* ========== Loading ========== */}
        {isLoading && (
          <div className='grid grid-cols-2 gap-4 sm:gap-6 max-[360px]:grid-cols-1 md:grid-cols-3 lg:grid-cols-4'>
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ========== Error ========== */}
        {isError && (
          <p className='text-sm text-red-600'>
            Failed to load products: {error.message}
          </p>
        )}

        {/* ========== Product list ========== */}
        {!isLoading && !isError && (
          <>
            {cards.length === 0 ? (
              <p className='text-sm text-zinc-600'>No products found.</p>
            ) : (
              <div className='grid grid-cols-2 gap-4 sm:gap-6 max-[360px]:grid-cols-1 md:grid-cols-3 lg:grid-cols-4'>
                {cards.map((c) => (
                  <Link
                    key={c.id}
                    href={`/products/${c.id}`}
                    className='group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm hover:shadow-md transition'
                  >
                    <div className='relative w-full h-44 md:h-48'>
                      <Image
                        src={safeImageSrc(c.imageUrl)}
                        alt={c.name}
                        fill
                        className='object-cover'
                        sizes='(max-width:768px) 50vw, (max-width:1024px) 33vw, 25vw'
                      />
                    </div>
                    <div className='p-4'>
                      <h3 className='font-medium text-zinc-900 line-clamp-2 group-hover:underline'>
                        {c.name}
                      </h3>
                      <p className='mt-1 font-semibold text-zinc-900'>
                        {formatIDR(c.price)}
                      </p>
                      <div className='mt-1 text-xs text-zinc-600 line-clamp-1'>
                        {c.shopName ?? '—'}
                      </div>
                    </div>
                  </Link>
                ))}

                {/* Skeleton tambahan saat fetching */}
                {isFetchingNextPage &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={`more-${i}`} />
                  ))}
              </div>
            )}

            {/* ========== Load More Button ========== */}
            {cards.length > 0 && (
              <div className='text-center mt-8'>
                {hasNextPage ? (
                  <Button
                    variant='outline'
                    size='md'
                    disabled={isFetchingNextPage}
                    onClick={() => fetchNextPage()}
                  >
                    {isFetchingNextPage ? 'Loading…' : 'Load More'}
                  </Button>
                ) : (
                  <p className='text-sm text-zinc-500'>No more products</p>
                )}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

/* =========================
   Utility: Currency Formatter
========================= */
function formatIDR(n?: number) {
  if (typeof n !== 'number') return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}
