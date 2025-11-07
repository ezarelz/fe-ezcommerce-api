// hooks/seller/useShopProfile.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

type ApiResp<T> = { success: boolean; message: string; data: T };

export type Shop = {
  id: number;
  name: string;
  slug: string;
  logo?: string | null; // URL image
  address?: string | null;
  isActive: boolean;
  _count?: { products: number; orderItems: number };
  createdAt?: string;
};

export const qk = {
  shop: ['seller', 'shopProfile'] as const,
};

/** GET /api/seller/shop */
export function useShopProfile() {
  return useQuery({
    queryKey: qk.shop,
    queryFn: async (): Promise<Shop> => {
      // ⬇️ langsung ambil object, karena BE tidak membungkus data
      const res = await api<Shop>('/api/seller/shop', {
        method: 'GET',
        useAuth: true,
      });

      // just in case API error
      if (!res || typeof res !== 'object') {
        throw new Error('Invalid response structure');
      }

      return res;
    },
  });
}

/** PATCH /api/seller/shop — multipart/form-data */
export function useUpdateShopProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name?: string;
      address?: string;
      isActive?: boolean;
      logoFile?: File | null;
    }) => {
      const fd = new FormData();
      if (payload.name !== undefined) fd.append('name', payload.name);
      if (payload.address !== undefined) fd.append('address', payload.address);
      if (payload.isActive !== undefined)
        fd.append('isActive', String(payload.isActive));
      if (payload.logoFile) fd.append('logo', payload.logoFile);

      const res = await api<ApiResp<Shop>>('/api/seller/shop', {
        method: 'PATCH',
        useAuth: true,
        data: fd,
      });
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.shop });
    },
  });
}
