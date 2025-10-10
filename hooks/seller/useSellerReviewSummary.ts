import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiResp, Review, Paged } from '@/types/reviews';

export type SellerSummaryItem = {
  productId: number;
  productName: string;
  productImage?: string | null;
  avgRating: number;
  totalReview: number;
};

export type SellerSummaryResp = {
  items: SellerSummaryItem[];
  page: number;
  limit: number;
  total: number;
  avgAll: number;
};

/**
 * Ambil ringkasan review untuk beberapa produk milik seller
 * dengan memanggil API /api/reviews/product/{id}?page=...&limit=...
 */
export function useSellerReviewSummary(
  productIds: number[],
  page = 1,
  limit = 10,
  q = ''
) {
  return useQuery({
    queryKey: ['seller', 'reviews', 'summary', productIds, page, limit, q],
    enabled: productIds.length > 0,
    queryFn: async (): Promise<SellerSummaryResp> => {
      // Fetch paralel semua review per produk
      const results = await Promise.all(
        productIds.map(async (pid) => {
          const res = await api<ApiResp<Paged<Review>>>(
            `/api/reviews/product/${pid}?page=${page}&limit=${limit}&q=${encodeURIComponent(
              q
            )}`,
            { method: 'GET', useAuth: true }
          );

          const items = res.data?.items ?? [];

          // Hitung rata-rata & total review
          const avg =
            items.length > 0
              ? items.reduce((acc, r) => acc + (r.star ?? 0), 0) / items.length
              : 0;

          return {
            productId: pid,
            productName: items[0]?.product?.name ?? `Product ${pid}`,
            productImage: items[0]?.product?.image ?? null,
            avgRating: avg,
            totalReview: items.length,
          };
        })
      );

      // Hitung ringkasan global
      const totalAll = results.reduce((acc, i) => acc + i.totalReview, 0);
      const avgAll =
        results.length > 0
          ? results.reduce((acc, i) => acc + i.avgRating, 0) / results.length
          : 0;

      return {
        items: results,
        page,
        limit,
        total: totalAll,
        avgAll,
      };
    },
  });
}
