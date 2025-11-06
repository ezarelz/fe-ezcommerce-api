'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import SellerShell from '@/components/seller/SellerShell';
import StarRating from '@/components/container/review/StarRating';
import { useSellerProductReviews } from '@/hooks/useReviews';
import { useSellerReviewSummary } from '@/hooks/seller/useSellerReviewSummary';
import { api } from '@/lib/api';

/* =========================
   Types lokal minimal
========================= */
type SellerProduct = {
  id: number;
  title?: string;
  name?: string;
  image?: string | null;
  images?: string[];
};

type PagedProducts = {
  items: SellerProduct[];
  page: number;
  limit: number;
  total: number;
};

/* =========================
   Ambil daftar produk milik seller
   dari /api/seller/products
========================= */
function useSellerProducts(page = 1, limit = 10, q = '') {
  return useQuery({
    queryKey: ['seller', 'products', page, limit, q],
    queryFn: async (): Promise<PagedProducts> => {
      const res = await api<{
        success: boolean;
        message: string;
        data: { products: SellerProduct[] };
      }>(`/api/seller/products?page=${page}&limit=${limit}&q=${q}`, {
        method: 'GET',
        useAuth: true,
      });

      const products = res.data?.products ?? [];
      return {
        items: products,
        page,
        limit,
        total: products.length,
      };
    },
  });
}

/* =========================
   Page utama Seller Reviews
========================= */
export default function SellerReviewsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [openPid, setOpenPid] = useState<number | null>(null);

  // 1) Ambil produk milik seller
  const { data: prod, isLoading: loadingProducts } = useSellerProducts(
    page,
    10,
    q
  );

  const productIds = useMemo(
    () => (prod?.items ?? []).map((p) => p.id),
    [prod?.items]
  );

  // 2) Ambil ringkasan review dari /api/reviews/my (grup berdasarkan productId)
  const { data: summary, isLoading: loadingSummary } =
    useSellerReviewSummary(productIds);

  const rows = useMemo(() => {
    const items = prod?.items ?? [];
    const sItems = summary?.items ?? [];

    return items.map((p) => {
      const s = sItems.find((x) => x.productId === p.id);
      return {
        productId: p.id,
        productName: p.title ?? p.name ?? `Product ${p.id}`,
        productImage: p.image ?? p.images?.[0] ?? '/placeholder.png',
        avgRating: s?.avgRating ?? 0,
        totalReview: s?.totalReview ?? 0,
      };
    });
  }, [prod?.items, summary?.items]);

  const isLoading = loadingProducts || loadingSummary;
  const avgAll = summary?.avgAll ?? 0;

  return (
    <SellerShell title='Reviews'>
      <div className='p-6'>
        {/* Header */}
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center gap-2 text-xl'>
            <span className='text-amber-500'>★</span>
            <span className='font-semibold'>{avgAll.toFixed(1)}</span>
            <span className='text-neutral-500'>/ 5.0</span>
          </div>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder='Search'
            className='rounded-xl border px-3 py-2'
          />
        </div>

        {/* Table */}
        <div className='overflow-x-auto rounded-2xl border bg-white dark:bg-neutral-900'>
          <table className='min-w-full text-sm'>
            <thead className='bg-neutral-50 dark:bg-neutral-800'>
              <tr className='[&>th]:px-4 [&>th]:py-3 text-left'>
                <th>No</th>
                <th>Product Name</th>
                <th>Rating</th>
                <th>Total Review</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading &&
                rows.map((it, idx) => (
                  <tr
                    key={it.productId}
                    className='border-t [&>td]:px-4 [&>td]:py-3'
                  >
                    <td>{(page - 1) * (prod?.limit ?? 10) + idx + 1}</td>
                    <td className='flex items-center gap-3'>
                      {it.productImage ? (
                        <Image
                          src={it.productImage}
                          alt={it.productName}
                          width={40}
                          height={40}
                          className='rounded object-cover'
                        />
                      ) : (
                        <div className='h-10 w-10 rounded bg-neutral-200' />
                      )}
                      {it.productName}
                    </td>
                    <td className='flex items-center gap-2'>
                      <StarRating value={it.avgRating} readOnly />
                      <span className='tabular-nums'>
                        {it.avgRating.toFixed(1)}
                      </span>
                    </td>
                    <td className='tabular-nums'>{it.totalReview}</td>
                    <td>
                      <button
                        onClick={() => setOpenPid(it.productId)}
                        className='rounded-lg border px-3 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      >
                        See All Review
                      </button>
                    </td>
                  </tr>
                ))}

              {isLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className='px-4 py-10 text-center text-neutral-500'
                  >
                    Loading…
                  </td>
                </tr>
              )}

              {!isLoading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className='px-4 py-10 text-center text-neutral-500'
                  >
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pager */}
        {prod && (
          <div className='mt-4 flex items-center justify-end gap-2'>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className='rounded-lg border px-3 py-1.5 disabled:opacity-50'
            >
              Previous
            </button>
            <span className='text-sm'>Page {page}</span>
            <button
              disabled={prod.page * prod.limit >= prod.total}
              onClick={() => setPage((p) => p + 1)}
              className='rounded-lg border px-3 py-1.5 disabled:opacity-50'
            >
              Next
            </button>
          </div>
        )}

        {/* Modal */}
        {openPid && (
          <SellerProductReviewsModal
            productId={openPid}
            onClose={() => setOpenPid(null)}
          />
        )}
      </div>
    </SellerShell>
  );
}

/* =========================
   Modal Detail Review Produk
========================= */
function SellerProductReviewsModal({
  productId,
  onClose,
}: {
  productId: number;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError } = useSellerProductReviews(
    productId,
    page,
    limit
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const avg =
    items.length > 0
      ? items.reduce((sum, r) => sum + Number(r.rating ?? r.star ?? 0), 0) /
        items.length
      : 0;

  return (
    <div
      className='fixed inset-0 z-50 grid place-items-center bg-black/40 p-4'
      role='dialog'
      aria-modal='true'
    >
      <div className='w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl dark:bg-neutral-950'>
        {/* Header */}
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-lg font-semibold'>Reviews</h3>
          <button
            onClick={onClose}
            className='rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            aria-label='Close'
          >
            ✕
          </button>
        </div>

        {/* Ringkasan */}
        <div className='mb-3 flex items-center gap-2'>
          <StarRating value={Number(avg.toFixed(1))} readOnly />
          <span className='font-semibold tabular-nums'>{avg.toFixed(1)}</span>
          <span className='text-neutral-500'>/ 5.0</span>
          <span className='ml-2 text-sm text-neutral-500'>
            ({total} review)
          </span>
        </div>

        {/* Isi */}
        <div className='max-h-[60vh] space-y-4 overflow-y-auto pr-1'>
          {isLoading && (
            <>
              <ReviewSkeleton />
              <ReviewSkeleton />
              <ReviewSkeleton />
            </>
          )}

          {isError && (
            <div className='rounded-lg border bg-white p-4 text-sm text-red-600 dark:bg-neutral-900'>
              Gagal memuat review.
            </div>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <div className='rounded-lg border bg-white p-4 text-sm text-neutral-600 dark:bg-neutral-900'>
              Belum ada review untuk produk ini.
            </div>
          )}

          {items.map((r) => (
            <div key={r.id} className='border-b pb-4 last:border-0'>
              {r.comment && <p className='text-sm mb-1'>{r.comment}</p>}
              <div className='mt-1 text-xs text-neutral-500'>
                {r.author?.name ? (
                  <>
                    From <span className='font-medium'>{r.author.name}</span> ·{' '}
                  </>
                ) : null}
                {r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                  : ''}
              </div>
            </div>
          ))}
        </div>

        {/* Pager */}
        {total > limit && (
          <div className='mt-4 flex items-center justify-end gap-2'>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className='rounded-lg border px-3 py-1.5 disabled:opacity-50'
            >
              Previous
            </button>
            <span className='text-sm'>
              Page {page}{' '}
              <span className='text-neutral-500'>
                / {Math.max(1, Math.ceil(total / limit))}
              </span>
            </span>
            <button
              disabled={data ? page * data.limit >= total : true}
              onClick={() => setPage((p) => p + 1)}
              className='rounded-lg border px-3 py-1.5 disabled:opacity-50'
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* Skeleton kecil untuk item review */
function ReviewSkeleton() {
  return (
    <div className='animate-pulse border-b pb-4 last:border-0'>
      <div className='mb-2 h-4 w-28 rounded bg-neutral-200 dark:bg-neutral-800' />
      <div className='h-4 w-full rounded bg-neutral-200 dark:bg-neutral-800' />
      <div className='mt-2 h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-800' />
    </div>
  );
}
