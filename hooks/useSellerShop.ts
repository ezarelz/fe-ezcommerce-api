// src/hooks/useSellerShop.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, token } from '@/lib/api';
import { QK } from '@/constants/queryKeys';

/** Bentuk response /api/seller/shop sesuai screenshot */
export type SellerShop = {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { products?: number; orderItems?: number };
};

type ApiResp<T> = { success: boolean; message: string; data: T };

/** GET /api/seller/shop — 404 => return null (belum seller) */
export function useSellerShop() {
  const enabled = !!token.get(); // hanya fetch kalau sudah login
  return useQuery({
    queryKey: QK.sellerShop(),
    enabled,
    queryFn: async (): Promise<SellerShop | null> => {
      try {
        const { data } = await api<ApiResp<SellerShop>>('/api/seller/shop', {
          method: 'GET',
          useAuth: true,
        });
        return data ?? null;
      } catch (err: unknown) {
        // @ts-expect-error: akses aman bila ada response
        const status = err?.response?.status as number | undefined;
        if (status === 404) return null; // Not a seller yet
        throw err; // error lain biarkan bubble up
      }
    },
    staleTime: 60_000,
  });
}

/** Optional: invalidasi setelah aktivasi/ubah toko */
export function useRefreshSellerShop() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: QK.sellerShop() });
}

/** Optional: kalau kamu tetap punya endpoint aktivasi FE */
export function useSellerActivate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fdOrBody: FormData | Record<string, unknown>) => {
      const { data } = await api<ApiResp<SellerShop>>('/api/seller/activate', {
        method: 'POST',
        data: fdOrBody,
        useAuth: true,
        headers:
          typeof FormData !== 'undefined' && fdOrBody instanceof FormData
            ? { 'Content-Type': 'multipart/form-data' }
            : undefined,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.sellerShop() });
      qc.invalidateQueries({ queryKey: QK.me() });
    },
  });
}
