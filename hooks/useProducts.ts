// src/hooks/useProducts.ts
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  getProductById,
  getRelatedProducts,
  getProductsList, // [ADD]
  getProductsPage, // [ADD]
} from '@/lib/api';
import type {
  ApiProduct,
  ApiProductDetail,
  ApiProductsResponse, // [ADD]
} from '@/types/products';

/** Non-infinite list */
// [CHANGE] — gunakan getProductsList (page-based page=1) agar shape konsisten
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
      getProductsList({
        limit: args?.limit,
        q: args?.q,
        category: args?.category,
        sellerId: args?.sellerId,
        ids: args?.ids,
      }),
  });
}

/** Infinite list (page-based sesuai BE) */
// [CHANGE] — sebelumnya cursor-based & getNextPageParam selalu undefined
export function useProductsInfinite(
  limit = 20,
  extras?: {
    q?: string;
    category?: string;
    sellerId?: number | string;
    ids?: number[];
  }
) {
  return useInfiniteQuery<ApiProductsResponse, Error>({
    queryKey: ['products-infinite', limit, extras],
    initialPageParam: 1, // mulai dari page 1
    queryFn: ({ pageParam = 1 }) =>
      getProductsPage({
        page: pageParam as number,
        limit,
        q: extras?.q,
        category: extras?.category,
        sellerId: extras?.sellerId,
        ids: extras?.ids,
      }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.data.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    // [ADD] — siapkan items datar biar enak dipakai di UI
    select: (data) => {
      const items = data.pages.flatMap((p) => p.data.products);
      return { ...data, items } as typeof data & { items: ApiProduct[] };
    },
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

/** Related */
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
