// app/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Header from '@/components/container/Header';
import Footer from '@/components/container/Footer';
import { useProductsInfinite } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  ApiProduct,
  ApiProductsResponse,
  ProductCardVM,
} from '@/types/products';
import { useEffect } from 'react';
import { useMe } from '@/hooks/useSession';
import { useRouter } from 'next/navigation';
import { InfiniteData } from '@tanstack/react-query';

// ====== CONFIG: pilih ID yang ingin ditampilkan di landing ======
const START_ID = 1;
const END_ID = 17; // ubah angka ini untuk range lain
const SELECTED_IDS: number[] = Array.from(
  { length: END_ID - START_ID + 1 },
  (_, i) => START_ID + i
);

// ====== Skeleton card ======
function ProductCardSkeleton() {
  return (
    <div
      className='group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm p-0'
      aria-hidden='true'
    >
      <div className='relative w-full'>
        {/* aspect-square placeholder */}
        <Skeleton className='w-full' style={{ paddingTop: '100%' }} />
      </div>
      <div className='p-4 space-y-2'>
        <Skeleton className='h-4 w-3/4' />
        <Skeleton className='h-4 w-1/3' />
      </div>
    </div>
  );
}

// ====== mapper ApiProduct -> ProductCardVM ======
function toCardVM(p: ApiProduct): ProductCardVM {
  return {
    id: p.id,
    name: p.title,
    price: p.price,
    imageUrl: p.images?.[0],
    rating: p.rating,
    shopName: p.shop?.name,
  };
}

export default function HomePage() {
  const router = useRouter();
  const { data: me, isLoading: meLoading } = useMe();

  // Redirect sesuai kebutuhanmu (contoh: user aktif diarahkan ke /products)
  useEffect(() => {
    if (meLoading) return;
    if (me && me.isActive) {
      router.replace('/products');
    }
  }, [meLoading, me, router]);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProductsInfinite(SELECTED_IDS.length, { ids: SELECTED_IDS });

  // beri tahu TS bahwa data adalah hasil dari InfiniteQuery + items:
  type ProductsInfiniteData = InfiniteData<ApiProductsResponse> & {
    items: ApiProduct[];
  };

  // ✅ Ambil array datar dari hook (sudah disiapkan di select: items)
  const items: ApiProduct[] =
    (data as ProductsInfiniteData | undefined)?.items ?? [];

  // Safety filter jika BE tidak support ?ids=
  const selectedProducts: ApiProduct[] =
    items.length > 0 ? items.filter((p) => SELECTED_IDS.includes(p.id)) : [];

  const cards: ProductCardVM[] = selectedProducts.map(toCardVM);

  return (
    <>
      <Header />

      <main className='min-h-dvh bg-white text-zinc-900'>
        {/* HERO */}
        <section
          aria-label='New Collection'
          className='mt-6 mx-auto w-full max-w-6xl rounded-xl overflow-hidden bg-[rgb(var(--brand-beige))]'
        >
          <div className='flex items-end md:items-center gap-4 md:gap-8 px-4 md:px-8 h-44 md:h-80'>
            <Image
              src='/hero-image.svg'
              alt='Hero Illustration'
              width={480}
              height={320}
              className='h-full w-auto object-contain select-none shrink-0'
              draggable={false}
              priority
            />
            <div className='flex-1 py-2 md:py-0'>
              <h1 className='text-lg md:text-5xl font-extrabold text-[#3D2B1F] leading-tight md:leading-[1.1]'>
                NEW COLLECTION
              </h1>
              <p className='mt-1 text-xs md:text-lg text-[#3D2B1F]/90 max-w-[34ch]'>
                Stylish men&apos;s apparel for every occasion
              </p>
              <Link href='/products'>
                <Button variant='brand' size='lg' className='mt-3 md:mt-6 w-44'>
                  Get Now
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className='max-w-6xl mx-auto px-3 sm:px-4 py-8 sm:py-12'>
          <div className='flex items-end justify-between mb-4 sm:mb-6'>
            <h2 className='text-xl sm:text-3xl font-bold'>
              Featured Product (ID {START_ID}–{END_ID})
            </h2>
            <Link
              href='/products'
              className='text-sm text-zinc-600 hover:underline'
            >
              View all
            </Link>
          </div>

          {/* Loading (Skeleton) */}
          {isLoading && (
            <div
              className='grid grid-cols-2 gap-4 sm:gap-6 max-[360px]:grid-cols-1 md:grid-cols-3 lg:grid-cols-4'
              role='status'
              aria-live='polite'
              aria-label='Loading products'
            >
              {Array.from({ length: SELECTED_IDS.length }).map((_, i) => (
                <ProductCardSkeleton key={`skeleton-${i}`} />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <p className='text-sm text-red-600'>
              Failed to load products: {error.message}
            </p>
          )}

          {/* Content */}
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
                          src={c.imageUrl ?? '/placeholder.png'}
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
                        {/* Optional (rating & toko)
                        <div className="mt-1 text-xs text-zinc-600 flex items-center gap-2">
                          <span>⭐ {c.rating?.toFixed(1) ?? '0.0'}</span>
                          <span className="truncate">• {c.shopName ?? '—'}</span>
                        </div>
                        */}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Load More — biasanya tak perlu untuk landing yang pakai range ID */}
              {cards.length > 0 && hasNextPage && (
                <div className='text-center mt-8'>
                  <Button
                    variant='outline'
                    size='md'
                    disabled={isFetchingNextPage}
                    onClick={() => fetchNextPage()}
                  >
                    {isFetchingNextPage ? 'Loading…' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}

function formatIDR(n?: number) {
  if (typeof n !== 'number') return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}
