// src/hooks/useCart.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, token } from '@/lib/api';

export type CartItem = {
  id: number; // cart item id (opsional)
  productId: number;
  title?: string;
  price?: number;
  image?: string;
  qty: number;
};

export type Cart = {
  items: CartItem[];
  // backend kamu bisa kirim field lain (subtotal, etc.)
};

type ApiResp<T> = { success: boolean; message: string; data: T };

const qk = {
  cart: ['cart'] as const,
};

/** GET /api/cart */
export function useCart() {
  const enabled = !!token.get();
  return useQuery({
    queryKey: qk.cart,
    enabled,
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

/** Hitung total qty dari cart */
export function useCartCount() {
  const { data } = useCart();
  const total =
    data?.items?.reduce((sum, it) => sum + (Number(it.qty) || 0), 0) ?? 0;
  return total;
}

/** POST /api/cart/add  { productId, qty } + optimistic update */
export function useAddToCart() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { productId: number; qty: number }) => {
      const res = await api<ApiResp<Cart>>('/api/cart/add', {
        method: 'POST',
        data: payload,
        useAuth: true,
      });
      return res.data; // backend bisa mengembalikan cart terbaru
    },
    onMutate: async ({ productId, qty }) => {
      await qc.cancelQueries({ queryKey: qk.cart });

      const prev = qc.getQueryData<Cart>(qk.cart);

      // optimistic: tambah qty pada item jika sudah ada, kalau tidak, buat baru minimal
      const next: Cart = {
        items: [...(prev?.items ?? [])],
      };
      const idx = next.items.findIndex((i) => i.productId === productId);
      if (idx >= 0)
        next.items[idx] = {
          ...next.items[idx],
          qty: next.items[idx].qty + qty,
        };
      else next.items.push({ id: Date.now(), productId, qty });

      qc.setQueryData(qk.cart, next);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.cart, ctx.prev);
    },
    onSuccess: (data) => {
      // kalau BE kirim cart terbaru, sync-kan
      if (data) qc.setQueryData(qk.cart, data);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.cart });
    },
  });
}
