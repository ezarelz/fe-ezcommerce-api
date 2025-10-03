'use client';
//update
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useProduct, useRelatedProducts } from '@/hooks/useProducts';
import type { ApiProductDetail } from '@/types/products';
import Header from '@/components/container/Header';
import Footer from '@/components/container/Footer';
import { useAddToCart } from '@/hooks/useCart';
import { token } from '@/lib/api';

// SVG data-uri simple placeholder (abu-abu)
const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            fill="#9ca3af" font-family="Arial, Helvetica, sans-serif" font-size="24">
        No Image
      </text>
    </svg>`
  );

function DetailSkeleton() {
  return (
    <main className='max-w-6xl mx-auto px-3 sm:px-4 py-8 sm:py-12'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <Skeleton className='w-full' style={{ paddingTop: '100%' }} />
          <div className='mt-3 grid grid-cols-4 gap-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-20 w-full rounded-md' />
            ))}
          </div>
        </div>
        <div className='space-y-3'>
          <Skeleton className='h-8 w-3/4' />
          <Skeleton className='h-7 w-1/3' />
          <Skeleton className='h-4 w-5/6' />
          <Skeleton className='h-4 w-2/3' />
          <Skeleton className='h-10 w-32' />
        </div>
      </div>
    </main>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // 1) Ambil detail produk
  const { data, isLoading, isError, error } = useProduct(id);

  // 2) Panggil related UNCONDITIONALLY (aman kalau argumen undefined)
  const categoryId = data?.category?.id;
  const excludeId = data?.id;
  const { data: related, isLoading: relatedLoading } = useRelatedProducts({
    categoryId,
    excludeId,
    limit: 4,
  });

  // 3) Mutasi cart (pakai hook khusus mutation)
  const addToCart = useAddToCart();

  const [qty, setQty] = useState<number>(1);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !data) {
    return (
      <>
        <Header />
        <main className='max-w-6xl mx-auto px-3 sm:px-4 py-8 sm:py-12'>
          <p className='text-red-600 text-sm'>
            Failed to load: {error?.message ?? 'Unknown error'}
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const p: ApiProductDetail = data;

  // Gambar & info
  const imgs =
    Array.isArray(p.images) && p.images.length > 0 ? p.images : [FALLBACK_IMG];
  const mainImage = imgs[Math.min(activeIndex, imgs.length - 1)];
  const formattedPrice = formatIDR(p.price);
  const ratingText = (p.rating ?? 0).toFixed(1);

  // Handler Add to Cart
  const handleAddToCart = async () => {
    if (!token.get()) {
      router.push(`/login?return_to=/products/${id}`);
      return;
    }
    await addToCart.mutateAsync({ productId: Number(p.id), qty });
  };

  return (
    <>
      <Header />
      <main className='max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-10'>
        {/* Breadcrumbs */}
        <nav className='text-xs sm:text-sm text-zinc-600 mb-4 sm:mb-6'>
          <Link href='/' className='hover:underline'>
            Home
          </Link>
          <span className='mx-2'>/</span>
          <Link href='/products' className='hover:underline'>
            Catalog
          </Link>
          <span className='mx-2'>/</span>
          <span className='text-zinc-900'>{p.title}</span>
        </nav>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Gallery */}
          <div>
            <div
              className='relative w-full rounded-xl overflow-hidden border bg-white'
              style={{ aspectRatio: '1 / 1' }}
            >
              <Image
                src={mainImage}
                alt={p.title}
                fill
                className='object-cover'
              />
            </div>

            {imgs.length > 1 && (
              <div className='mt-3 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 gap-2'>
                {imgs.slice(0, 10).map((src, i) => (
                  <button
                    key={i}
                    aria-label={`thumbnail-${i + 1}`}
                    className={[
                      'relative w-full h-16 sm:h-20 rounded-md overflow-hidden border',
                      i === activeIndex
                        ? 'ring-2 ring-zinc-900'
                        : 'hover:opacity-90',
                    ].join(' ')}
                    onClick={() => setActiveIndex(i)}
                  >
                    <Image
                      src={src}
                      alt={`thumb-${i}`}
                      fill
                      className='object-cover'
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold'>{p.title}</h1>
            <p className='mt-2 text-2xl font-semibold'>{formattedPrice}</p>

            <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-700'>
              <span className='inline-flex items-center gap-1'>
                <Image
                  src='/icons/star-rating.svg'
                  alt='rating'
                  width={14}
                  height={14}
                  className='inline-block'
                />
                {ratingText}
              </span>
              <span>• {p.reviewCount} reviews</span>
              <span>• {p.soldCount} sold</span>
              <span>• Stock: {p.stock}</span>
            </div>

            {/* shop + category */}
            <div className='mt-4 flex items-center justify-between'>
              <div className='min-w-0'>
                <div className='font-medium text-zinc-900 truncate'>
                  {p.shop.name}
                </div>
                <div className='text-xs text-zinc-600 truncate'>
                  {p.category.name}
                </div>
              </div>
              <Link href={`/shops/${p.shop.slug}`} className='shrink-0'>
                <Button variant='outline' size='sm'>
                  See Store
                </Button>
              </Link>
            </div>

            {/* description */}
            <div className='mt-6'>
              <h2 className='font-semibold mb-2'>Deskripsi</h2>
              <p className='text-zinc-800 leading-relaxed whitespace-pre-line'>
                {p.description ?? 'No description.'}
              </p>
            </div>

            {/* quantity + add to cart */}
            <div className='mt-6'>
              <div className='text-sm text-zinc-700 mb-2'>Quantity</div>
              <div className='flex items-center gap-3'>
                <div className='inline-flex items-center rounded-lg border'>
                  <button
                    aria-label='decrease'
                    className='px-3 py-2 cursor-pointer disabled:opacity-50'
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                  >
                    −
                  </button>
                  <div className='px-4 py-2 min-w-10 text-center'>{qty}</div>
                  <button
                    aria-label='increase'
                    className='px-3 py-2 cursor-pointer disabled:opacity-50'
                    onClick={() =>
                      setQty((q) =>
                        Math.min(
                          typeof p.stock === 'number' ? p.stock : q + 1,
                          q + 1
                        )
                      )
                    }
                    disabled={
                      typeof p.stock === 'number' ? qty >= p.stock : false
                    }
                  >
                    +
                  </button>
                </div>

                <Button
                  size='lg'
                  className='px-6'
                  onClick={handleAddToCart}
                  disabled={addToCart.isPending}
                >
                  {addToCart.isPending ? 'Adding…' : 'Add to Cart'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className='mt-10'>
          <h2 className='text-lg sm:text-xl font-semibold mb-3'>
            Product Reviews
          </h2>
          <div className='text-sm text-zinc-700 mb-4 flex items-center gap-2'>
            <span className='inline-flex items-center gap-1'>
              <Image
                src='/icons/star-rating.svg'
                alt='rating'
                width={14}
                height={14}
                className='inline-block'
              />
              {ratingText}
            </span>
            <span>• {p.reviewCount} reviews</span>
          </div>

          {Array.isArray((p as unknown as { reviews?: unknown[] }).reviews) &&
          (p as unknown as { reviews: unknown[] }).reviews.length > 0 ? (
            <div className='space-y-4'>
              {(p as unknown as { reviews: ReviewVM[] }).reviews
                .slice(0, 3)
                .map((rev, idx) => (
                  <div key={rev.id ?? idx} className='rounded-xl border p-4'>
                    <div className='flex items-center gap-3'>
                      <div className='relative h-10 w-10 rounded-full overflow-hidden bg-zinc-200'>
                        <Image
                          src={rev.userAvatar ?? FALLBACK_IMG}
                          alt={rev.userName ?? 'user'}
                          fill
                          className='object-cover'
                        />
                      </div>
                      <div className='min-w-0'>
                        <div className='font-medium truncate'>
                          {rev.userName ?? 'Anonymous'}
                        </div>
                        <div className='text-xs text-zinc-600'>
                          ⭐ {(rev.rating ?? 0).toFixed(1)} •{' '}
                          {formatDate(rev.createdAt)}
                        </div>
                      </div>
                    </div>
                    {rev.comment && (
                      <p className='mt-3 text-sm text-zinc-800 leading-relaxed'>
                        {rev.comment}
                      </p>
                    )}
                  </div>
                ))}
              {(p as unknown as { reviews: unknown[] }).reviews.length > 3 && (
                <div className='text-center mt-4'>
                  <Button variant='outline' size='sm'>
                    Load More
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className='text-sm text-zinc-600'>Belum ada ulasan.</p>
          )}
        </section>

        {/* RELATED PRODUCTS */}
        <section className='mt-16'>
          <h2 className='text-lg sm:text-xl font-semibold mb-6'>
            Related Product
          </h2>

          {relatedLoading ? (
            <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-48 w-full rounded-md' />
              ))}
            </div>
          ) : related && related.length > 0 ? (
            <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
              {related.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/products/${rp.id}`}
                  className='space-y-2 group'
                >
                  <div className='relative w-full h-48 rounded-md overflow-hidden'>
                    <Image
                      src={rp.images?.[0] || FALLBACK_IMG}
                      alt={rp.title}
                      fill
                      className='object-cover group-hover:scale-105 transition'
                    />
                  </div>
                  <h3 className='text-sm font-medium line-clamp-2'>
                    {rp.title}
                  </h3>
                  <p className='font-semibold'>{formatIDR(rp.price)}</p>
                  <p className='text-sm text-zinc-600 flex items-center gap-1'>
                    <Image
                      src='/icons/star-rating.svg'
                      alt='rating'
                      width={14}
                      height={14}
                      className='inline-block'
                    />
                    {(rp.rating ?? 0).toFixed(1)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className='text-sm text-zinc-600'>No related products.</p>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}

/* ------------------------------ helper types ------------------------------ */
type ReviewVM = {
  id?: number | string;
  userName?: string;
  userAvatar?: string;
  rating?: number;
  comment?: string;
  createdAt?: string;
};

/* ---------------------------------- utils --------------------------------- */
function formatIDR(n?: number) {
  if (typeof n !== 'number') return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}
function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
