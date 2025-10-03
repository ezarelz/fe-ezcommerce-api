// src/hooks/useCart.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ==== Types dari API kamu ====
export type CartItem = {
  id: number; // itemId (untuk PATCH/DELETE)
  productId: number;
  title?: string;
  price?: number;
  image?: string;
  qty: number;
};

export type Cart = {
  cartId: number;
  items: CartItem[];
  grandTotal: number; // hitung total dari API
};

type ApiResp<T> = { success: boolean; message: string; data: T };

const qk = {
  cart: ['cart'] as const,
};

// ==== GET /api/cart ====
export function useCart() {
  return useQuery({
    queryKey: qk.cart,
    queryFn: async (): Promise<Cart> => {
      const res = await api<ApiResp<Cart>>('/api/cart', {
        method: 'GET',
        useAuth: true,
      });
      return res.data;
    },
    staleTime: 30_000,
  });
}

// Hitung total qty utk badge header
export function useCartCount() {
  const { data } = useCart();
  return data?.items?.reduce((s, it) => s + (it.qty || 0), 0) ?? 0;
}

// ==== POST /api/cart/items ====
export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { productId: number; qty: number }) => {
      const res = await api<ApiResp<Cart>>('/api/cart/items', {
        method: 'POST',
        data: payload,
        useAuth: true,
      });
      return res.data; // cart terbaru dari server
    },
    onSuccess: (data) => {
      qc.setQueryData(qk.cart, data);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.cart });
    },
  });
}

// ==== PATCH /api/cart/items/{itemId} ====
export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { itemId: number; qty: number }) => {
      const res = await api<ApiResp<Cart>>(`/api/cart/items/${args.itemId}`, {
        method: 'PATCH',
        data: { qty: args.qty },
        useAuth: true,
      });
      return res.data;
    },
    onSuccess: (data) => qc.setQueryData(qk.cart, data),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.cart }),
  });
}

// ==== DELETE /api/cart/items/{itemId} ====
export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: number) => {
      const res = await api<ApiResp<Cart>>(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
        useAuth: true,
      });
      return res.data;
    },
    onSuccess: (data) => qc.setQueryData(qk.cart, data),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.cart }),
  });
}

// ==== DELETE /api/cart ====
export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api<ApiResp<Cart>>('/api/cart', {
        method: 'DELETE',
        useAuth: true,
      });
      return res.data;
    },
    onSuccess: (data) => qc.setQueryData(qk.cart, data),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.cart }),
  });
}
