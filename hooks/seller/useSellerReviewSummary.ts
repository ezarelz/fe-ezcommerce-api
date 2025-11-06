/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import { getProductReviewsById } from '@/lib/api';
import type { Review, SellerSummaryResp } from '@/types/reviews';

/**
 * Seller-side summary (fallback ke /api/reviews/my karena BE tidak menyediakan
 * /api/reviews/product/{id} yang konsisten)
 */
export function useSellerReviewSummary(
  productIds: number[],
  page = 1,
  limit = 50
) {
  return useQuery({
    queryKey: ['seller', 'reviews', 'summary', productIds, page, limit],
    enabled: productIds.length > 0,
    queryFn: async (): Promise<SellerSummaryResp> => {
      const results = await Promise.all(
        productIds.map(async (pid) => {
          try {
            const data: Review[] = await getProductReviewsById(
              pid,
              page,
              limit
            );

            const avg =
              data.length > 0
                ? data.reduce(
                    (acc, r) => acc + Number(r.rating ?? r.star ?? 0),
                    0
                  ) / data.length
                : 0;

            const first = data[0]?.product;

            return {
              productId: pid,
              productName: first?.title ?? first?.name ?? `Product ${pid}`,
              productImage: first?.images?.[0] ?? '/placeholder.png',
              avgRating: avg,
              totalReview: data.length,
            };
          } catch (err: any) {
            console.warn(
              `⚠️ Gagal ambil review untuk product ${pid}`,
              err.message
            );
            return {
              productId: pid,
              productName: `Product ${pid}`,
              productImage: '/placeholder.png',
              avgRating: 0,
              totalReview: 0,
            };
          }
        })
      );

      const totalAll = results.reduce((acc, i) => acc + i.totalReview, 0);
      const avgAll =
        results.length > 0
          ? results.reduce((acc, i) => acc + i.avgRating, 0) / results.length
          : 0;

      return { items: results, page, limit, total: totalAll, avgAll };
    },
  });
}
