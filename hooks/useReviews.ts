/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '@/lib/api';
import type { ApiResp, Review, Paged, Eligible } from '@/types/reviews';
import type { ReviewValues } from '@/validator/review';

/* -------------------------- Utility: pagination helper -------------------------- */
function toPaged<T>(raw: any, fallbackPage = 1, fallbackLimit = 10): Paged<T> {
  if (Array.isArray(raw)) {
    return {
      items: raw as T[],
      page: fallbackPage,
      limit: fallbackLimit,
      total: raw.length,
    };
  }

  const src = raw?.items ? raw : raw?.data ? raw.data : raw;
  const items: T[] = Array.isArray(src?.items)
    ? src.items
    : Array.isArray(src)
    ? src
    : [];

  return {
    items,
    page: Number(src?.page) || fallbackPage,
    limit: Number(src?.limit) || fallbackLimit,
    total: Number(src?.total) || items.length,
  };
}

/* ------------------------------- Query Keys ------------------------------- */
const qk = {
  product: (id: number, page = 1, limit = 10) =>
    ['reviews', 'product', id, page, limit] as const,
  mine: (page = 1, limit = 10, star?: number, q = '') =>
    ['reviews', 'me', page, limit, star ?? 'all', q] as const,
  eligible: (page = 1, limit = 10) =>
    ['reviews', 'eligible', page, limit] as const,
};

/* ------------------------ Get reviews for one product ------------------------ */
export function useProductReviews(productId: number, page = 1, limit = 10) {
  return useQuery({
    queryKey: qk.product(productId, page, limit),
    enabled: !!productId,
    queryFn: async (): Promise<Paged<Review>> => {
      const res = await api<ApiResp<any>>(
        `/api/reviews/product/${productId}?page=${page}&limit=${limit}`,
        {
          method: 'GET',
        }
      );
      return toPaged<Review>(res.data, page, limit);
    },
  });
}

/* ----------------------- Alias (seller side compatibility) ----------------------- */
export const useSellerProductReviews = useProductReviews;

/* -------------------------- Get all my reviews (buyer) -------------------------- */
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
      const res = await api<ApiResp<any>>(`/api/reviews/my?${params}`, {
        method: 'GET',
        useAuth: true,
      });

      // Normalisasi data utama
      const raw = Array.isArray(res.data?.data)
        ? res.data.data
        : res.data?.items ?? res.data ?? [];

      // Tambahkan image + fetch shop info dari backend publik
      const enriched: Review[] = await Promise.all(
        raw.map(async (r: any) => {
          const image =
            Array.isArray(r.product?.images) && r.product.images.length > 0
              ? r.product.images[0]
              : '/placeholder.png';

          // Ambil shop
          if (!r.product?.shop) {
            try {
              const productRes = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/products/${r.productId}`
              );
              r.product.shop = productRes.data?.data?.product?.shop ?? null;
            } catch (err: any) {
              console.warn(
                `⚠️ Gagal ambil shop untuk product ${r.productId}`,
                err.message
              );
              r.product.shop = { name: 'Unknown Shop' };
            }
          }

          return {
            ...r,
            product: {
              ...r.product,
              image,
            },
          };
        })
      );

      return {
        items: enriched,
        page,
        limit,
        total: enriched.length,
      };
    },
    retry: (failureCount, err: any) =>
      (err?.response?.status ?? 500) !== 401 && failureCount < 2,
  });
}

/* ---------------------- Get products eligible for review ---------------------- */
export function useMyEligible(page = 1, limit = 50) {
  return useQuery({
    queryKey: qk.eligible(page, limit),
    queryFn: async (): Promise<Paged<Eligible>> => {
      const res = await api<ApiResp<any>>(
        `/api/reviews/my/eligible?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          useAuth: true,
        }
      );

      const raw = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      const normalized: Eligible[] = raw.map((p: any) => ({
        productId: p.id,
        ...p,
        name: p.title ?? p.name ?? 'Unnamed Product',
        image:
          Array.isArray(p.images) && p.images.length > 0
            ? p.images[0]
            : '/placeholder.png',
      }));

      return {
        items: normalized,
        page,
        limit,
        total: normalized.length,
      };
    },
    retry: (failureCount, err: any) =>
      (err?.response?.status ?? 500) !== 401 && failureCount < 2,
  });
}

/* -------------------------- Create / Update review -------------------------- */
export function useCreateOrUpdateReview(productId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ReviewValues): Promise<Review> => {
      const res = await api<ApiResp<Review>>('/api/reviews', {
        method: 'POST',
        data: { productId, ...payload },
        useAuth: true,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['orders', 'mine'] });
    },
  });
}

/* ------------------------------ Delete my review ------------------------------ */
export function useDeleteMyReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<number> => {
      await api(`/api/reviews/${id}`, { method: 'DELETE', useAuth: true });
      return id;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['reviews'] });

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
        Object.entries(ctx.prev).forEach(([k, v]) =>
          qc.setQueryData(JSON.parse(k), v)
        );
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['orders', 'mine'] });
    },
  });
}
