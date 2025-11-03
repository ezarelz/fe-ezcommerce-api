'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

/* ====================== API Response Type ====================== */
type ApiResp<T> = {
  success: boolean;
  message: string;
  data: T;
};

/* ====================== Order Types ====================== */
export type OrderItem = {
  id: number;
  orderId?: number; // 🟢 optional agar bisa cocok ke backend & frontend
  productId: number;
  quantity: number;
  price: number;
  status: 'PENDING' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  product?: {
    id: number;
    title?: string;
    name?: string;
    images?: string[];
  };
};

export type Order = {
  id: number;
  userId?: number; // 🟢 tambahkan biar cocok dengan page.tsx
  address: string;
  shipping: string;
  payment: string;
  total: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

/* ====================== Hook ====================== */
export function useBuyerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // ✅ Ambil order utama
      const res = await api<ApiResp<Order[]>>(
        `/api/orders/my?page=${page}&limit=10`,
        { method: 'GET', useAuth: true }
      );

      const ordersData = res.data ?? [];

      // ✅ Enrich: ambil product info untuk setiap item
      const enrichedOrders = await Promise.all(
        ordersData.map(async (order) => {
          const enrichedItems = await Promise.all(
            order.items.map(async (it) => {
              try {
                const productRes = await api<
                  ApiResp<{
                    product: { id: number; title: string; images?: string[] };
                  }>
                >(`/api/products/${it.productId}`, { method: 'GET' });

                const product = productRes.data?.product;
                return {
                  ...it,
                  product: {
                    id: product?.id ?? it.productId,
                    title: product?.title ?? 'Unknown Product',
                    name: product?.title ?? 'Unknown Product',
                    images: product?.images?.length
                      ? product.images
                      : ['/placeholder.png'],
                  },
                };
              } catch (err) {
                console.warn(`❌ Failed to fetch product ${it.productId}`, err);
                return {
                  ...it,
                  product: {
                    id: it.productId,
                    title: 'Unknown Product',
                    name: 'Unknown Product',
                    images: ['/placeholder.png'],
                  },
                };
              }
            })
          );
          return { ...order, items: enrichedItems };
        })
      );

      setOrders(enrichedOrders);
    } catch (err: unknown) {
      console.error('Fetch orders failed:', err);
      if (err instanceof Error) setError(err.message);
      else if (typeof err === 'string') setError(err);
      else setError('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, error, refetch: fetchOrders, page, setPage };
}
