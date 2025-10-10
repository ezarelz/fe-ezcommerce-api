/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useReviews.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiResp } from '@/types/reviews';
import type { Review, Paged, Eligible } from '@/types/reviews';
import type { ReviewValues } from '@/validator/review';

/** Normalisasi respons ke bentuk paginated
 *  Aman jika BE kadang balikin array langsung, atau { data: { items,... } }
 */
function toPaged<T>(raw: any, fallbackPage = 1, fallbackLimit = 10): Paged<T> {
  if (Array.isArray(raw)) {
    return {
      items: raw as T[],
      page: fallbackPage,
      limit: fallbackLimit,
      total: (raw as T[]).length,
    };
  }
  const src = raw?.items ? raw : raw?.data ? raw.data : raw;
  const items: T[] = Array.isArray(src?.items)
    ? (src.items as T[])
    : Array.isArray(src)
    ? (src as T[])
    : [];
  const page = Number(src?.page) || fallbackPage;
  const limit = Number(src?.limit) || fallbackLimit;
  const total = Number(src?.total) || items.length;
  return { items, page, limit, total };
}

const qk = {
  product: (id: number, page = 1, limit = 10) =>
    ['reviews', 'product', id, page, limit] as const,
  mine: (page = 1, limit = 10, star?: number, q = '') =>
    ['reviews', 'me', page, limit, star ?? 'all', q] as const,
  eligible: (page = 1, limit = 10) =>
    ['reviews', 'eligible', page, limit] as const,
};

/** PUBLIC: daftar review untuk 1 produk */
export function useProductReviews(productId: number, page = 1, limit = 10) {
  return useQuery({
    queryKey: qk.product(productId, page, limit),
    enabled: !!productId,
    queryFn: async (): Promise<Paged<Review>> => {
      const res = await api<ApiResp<any>>(
        `/api/reviews/product/${productId}?page=${page}&limit=${limit}`,
        { method: 'GET' }
      );
      return toPaged<Review>(res.data, page, limit);
    },
  });
}

/** Alias supaya import lama di sisi seller tetap jalan */
export const useSellerProductReviews = useProductReviews;

/** AUTH: semua review yang pernah saya tulis */
export function useMyReviews(page = 1, limit = 10, star?: number, q = '') {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (star) params.set('star', String(star));
  if (q) params.set('q', q);

  return useQuery({
    queryKey: qk.mine(page, limit, star, q),
    queryFn: async (): Promise<Paged<Review>> => {
      const res = await api<ApiResp<any>>(
        `/api/reviews/my?${params.toString()}`,
        { method: 'GET', useAuth: true }
      );
      return toPaged<Review>(res.data, page, limit);
    },
    retry: (failureCount, err: any) =>
      (err?.response?.status ?? 500) !== 401 && failureCount < 2,
  });
}

/** AUTH: produk yang sudah COMPLETED tapi belum saya review */
export function useMyEligible(page = 1, limit = 50) {
  return useQuery({
    queryKey: qk.eligible(page, limit),
    queryFn: async (): Promise<Paged<Eligible>> => {
      const res = await api<ApiResp<any>>(
        `/api/reviews/my/eligible?page=${page}&limit=${limit}`,
        { method: 'GET', useAuth: true }
      );
      return toPaged<Eligible>(res.data, page, limit);
    },
    retry: (failureCount, err: any) =>
      (err?.response?.status ?? 500) !== 401 && failureCount < 2,
  });
}

/** AUTH: upsert review (must purchased & COMPLETED) */
export function useCreateOrUpdateReview(productId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReviewValues): Promise<Review> => {
      // payload shape: { star, comment }
      const res = await api<ApiResp<Review>>('/api/reviews', {
        method: 'POST',
        data: { productId, ...payload },
        useAuth: true,
      });
      return res.data;
    },
    onSuccess: () => {
      // refresh semua daftar review + kemungkinan daftar order
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['orders', 'mine'] });
    },
  });
}

/** AUTH: hapus review saya */
export function useDeleteMyReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<number> => {
      await api(`/api/reviews/${id}`, { method: 'DELETE', useAuth: true });
      return id;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['reviews'] });

      // optimistic remove pada semua cache "reviews/me"
      const keys = qc
        .getQueryCache()
        .findAll({ queryKey: ['reviews', 'me'] })
        .map((q) => q.queryKey);

      const prev: Record<string, unknown> = {};
      keys.forEach((key) => {
        const snap = qc.getQueryData<Paged<Review>>(key);
        if (snap) {
          prev[JSON.stringify(key)] = snap;
          qc.setQueryData<Paged<Review>>(key, {
            ...snap,
            items: snap.items.filter((r) => r.id !== id),
            total: Math.max(0, snap.total - 1),
          });
        }
      });

      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        Object.entries(ctx.prev).forEach(([k, v]) => {
          qc.setQueryData(JSON.parse(k), v);
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['orders', 'mine'] });
    },
  });
}
