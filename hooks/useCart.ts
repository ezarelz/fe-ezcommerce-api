/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import { QK } from '@/constants/queryKeys';
import type {
  CartResponse,
  CartItem,
  AddCartItemRequest,
  UpdateCartItemQtyRequest,
  RemoveCartItemRequest,
} from '@/types/cart';

/** ==== Bentuk respons mentah dari BE ==== */
type RawGroup = {
  shop: {
    id: number;
    name: string;
    slug?: string;
  };
  items: {
    id: number;
    quantity: number;
    product: {
      id: number;
      name?: string;
      title?: string;
      price: number;
      imageUrl?: string;
      images?: string[];
    };
    subtotal: number;
  }[];
  total: number;
};

type RawCart = {
  groups: RawGroup[];
  grandTotal: number;
};

type ApiResp<T> = { success: boolean; message: string; data: T };

/** ==== Normalizer ==== */
function normalizeCart(raw: RawCart): CartResponse {
  const items: CartItem[] = [];

  (raw.groups ?? []).forEach((g) => {
    (g.items ?? []).forEach((it) => {
      items.push({
        id: String(it.id),
        quantity: Number(it.quantity ?? 1),
        product: {
          id: it.product.id,
          title: it.product.title ?? it.product.name ?? 'Unknown Product',
          price: Number(it.product.price ?? 0),
          images: it.product.images?.length
            ? it.product.images
            : it.product.imageUrl
            ? [it.product.imageUrl]
            : [],

          shop: {
            id: g.shop.id,
            name: g.shop.name ?? 'Unknown Shop',
            slug: g.shop.slug ?? undefined,
          },
        },
      });
    });
  });

  return { items, grandTotal: Number(raw.grandTotal ?? 0) };
}
/** ==== GET /api/cart ==== */
export function useCart() {
  return useQuery<CartResponse, Error>({
    queryKey: QK.cart(),
    queryFn: async () => {
      // pastikan deklarasi generic di sini
      const res = await api<ApiResp<RawCart>>('/api/cart', {
        method: 'GET',
        useAuth: true,
      });

      // ambil data di dalam response wrapper
      const raw = (res.data as any).data ?? res.data;
      return normalizeCart(raw);
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    notifyOnChangeProps: ['data', 'isLoading', 'isError'],
  });
}
/** ==== Cart Count (badge) ==== */
export function useCartCount() {
  const { data } = useCart();
  return data?.items?.reduce((s, it) => s + (it.quantity || 0), 0) ?? 0;
}

/** ==== POST /api/cart/items ==== */
export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddCartItemRequest) => {
      const res = await api<ApiResp<RawCart>>('/api/cart/items', {
        method: 'POST',
        data: { productId: payload.productId, qty: payload.quantity },
        useAuth: true,
      });
      return normalizeCart((res.data as any).data ?? res.data);
    },
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: QK.cart() });
      const prev = qc.getQueryData<CartResponse>(QK.cart());

      if (prev) {
        const exists = prev.items.find(
          (it) => it.product.id === payload.productId
        );
        let next: CartResponse;
        if (exists) {
          next = {
            ...prev,
            items: prev.items.map((it) =>
              it.product.id === payload.productId
                ? { ...it, quantity: it.quantity + payload.quantity }
                : it
            ),
          };
        } else {
          next = {
            ...prev,
            items: [
              ...prev.items,
              {
                id: `temp-${payload.productId}`,
                quantity: payload.quantity,
                product: {
                  id: payload.productId,
                  title: 'Loading…',
                  price: 0,
                  images: [],
                },
              },
            ],
          };
        }
        qc.setQueryData(QK.cart(), next);
      }

      return { prev };
    },
    onError: (_err, _payload, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.cart(), ctx.prev);
    },
    onSuccess: (data) => {
      qc.setQueryData(QK.cart(), data);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QK.cart() });
    },
  });
}

/** ==== PATCH /api/cart/items/{itemId} ==== */
export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cartItemId, quantity }: UpdateCartItemQtyRequest) => {
      const res = await api<ApiResp<RawCart>>(`/api/cart/items/${cartItemId}`, {
        method: 'PATCH',
        data: { qty: quantity },
        useAuth: true,
      });
      return normalizeCart((res.data as any).data ?? res.data);
    },
    onMutate: async ({ cartItemId, quantity }) => {
      await qc.cancelQueries({ queryKey: QK.cart() });
      const prev = qc.getQueryData<CartResponse>(QK.cart());

      if (prev) {
        const next: CartResponse = {
          ...prev,
          items: prev.items.map((it) =>
            it.id === String(cartItemId) ? { ...it, quantity } : it
          ),
        };
        qc.setQueryData(QK.cart(), next);
      }

      return { prev };
    },
    onError: (_err, _payload, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.cart(), ctx.prev);
    },
    onSuccess: (data) => qc.setQueryData(QK.cart(), data),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.cart() }),
  });
}

/** ==== DELETE /api/cart/items/{itemId} ==== */
export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cartItemId }: RemoveCartItemRequest) => {
      const res = await api<ApiResp<RawCart>>(`/api/cart/items/${cartItemId}`, {
        method: 'DELETE',
        useAuth: true,
      });
      return normalizeCart((res.data as any).data ?? res.data);
    },
    onMutate: async ({ cartItemId }) => {
      await qc.cancelQueries({ queryKey: QK.cart() });
      const prev = qc.getQueryData<CartResponse>(QK.cart());

      if (prev) {
        const next: CartResponse = {
          ...prev,
          items: prev.items.filter((it) => it.id !== String(cartItemId)),
        };
        qc.setQueryData(QK.cart(), next);
      }

      return { prev };
    },
    onError: (_err, _payload, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.cart(), ctx.prev);
    },
    onSuccess: (data) => qc.setQueryData(QK.cart(), data),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.cart() }),
  });
}

/** ==== DELETE /api/cart ==== */
export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api<ApiResp<RawCart>>('/api/cart', {
        method: 'DELETE',
        useAuth: true,
      });
      return normalizeCart((res.data as any).data ?? res.data);
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: QK.cart() });
      const prev = qc.getQueryData<CartResponse>(QK.cart());
      qc.setQueryData(QK.cart(), { items: [], grandTotal: 0 });
      return { prev };
    },
    onError: (_err, _payload, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.cart(), ctx.prev);
    },
    onSuccess: (data) => qc.setQueryData(QK.cart(), data),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.cart() }),
  });
}
