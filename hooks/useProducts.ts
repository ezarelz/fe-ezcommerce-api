// src/hooks/useProducts.ts
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getProductById, getProducts, getRelatedProducts } from '@/lib/api';
import type { ApiProduct, ApiProductDetail } from '@/types/products';

/** Non-infinite list */
export function useProducts(args?: {
  limit?: number;
  q?: string;
  category?: string;
  sellerId?: number | string;
  ids?: number[];
}) {
  return useQuery<ApiProduct[], Error>({
    queryKey: ['products', args],
    queryFn: () =>
      getProducts({
        limit: args?.limit,
        q: args?.q,
        category: args?.category,
        sellerId: args?.sellerId,
        ids: args?.ids,
      }),
  });
}

/** Infinite list (cursor optional; akan berhenti otomatis jika BE belum support) */
export function useProductsInfinite(
  limit = 20,
  extras?: {
    q?: string;
    category?: string;
    sellerId?: number | string;
    ids?: number[];
  }
) {
  return useInfiniteQuery<ApiProduct[], Error>({
    queryKey: ['products-infinite', limit, extras],
    queryFn: ({ pageParam }) =>
      getProducts({
        limit,
        cursor: (pageParam as string | number | null) ?? null,
        q: extras?.q,
        category: extras?.category,
        sellerId: extras?.sellerId,
        ids: extras?.ids,
      }),
    initialPageParam: null,
    // BE saat ini belum expose cursor → undefined = tidak ada page berikutnya
    getNextPageParam: () => undefined,
  });
}

/** Detail */
export function useProduct(id: number | string) {
  return useQuery<ApiProductDetail, Error>({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
    enabled: !!id,
  });
}

export function useRelatedProducts(args: {
  categoryId?: number;
  excludeId?: number;
  limit?: number;
}) {
  const { categoryId, excludeId, limit = 4 } = args;

  const enabled =
    typeof categoryId === 'number' && typeof excludeId === 'number';

  return useQuery<ApiProduct[], Error>({
    queryKey: ['related', categoryId, excludeId, limit],
    queryFn: () => getRelatedProducts(categoryId!, excludeId!, limit),
    enabled, // ← only runs when both ids are known
  });
}
