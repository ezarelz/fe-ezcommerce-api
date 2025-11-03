/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * Status pesanan seller
 */
export type SellerOrderStatus =
  | 'PENDING'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'COMPLETED';

export type DashboardOrderItem = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  status: SellerOrderStatus;
  createdAt?: string;
  product?: {
    id: number;
    title: string;
    images?: string[];
    price?: number;
  };
};

export type DashboardMetrics = {
  totalProducts: number;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
};

type ApiResp<T> = { success: boolean; message: string; data: T };

/**
 * Normalisasi hasil API agar selalu array
 */
function normalizeToArray(payload: any): DashboardOrderItem[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (payload?.data && typeof payload.data === 'object') return [payload.data];
  if (payload && typeof payload === 'object') return [payload];
  return [];
}

/**
 * ✅ Hook utama untuk dashboard seller
 * Ambil order items dari `/api/seller-fulfillment/order-items`
 * dan hitung metrics otomatis.
 */
export function useSellerOrderItems(opts?: {
  status?: SellerOrderStatus | 'ALL';
  take?: number;
}) {
  const { status = 'ALL', take = 100 } = opts ?? {};

  const q = useQuery({
    queryKey: ['seller', 'order-items', { status, take }],
    queryFn: async (): Promise<DashboardOrderItem[]> => {
      const res = await api<ApiResp<DashboardOrderItem[]>>(
        '/api/seller-fulfillment/order-items',
        { method: 'GET', useAuth: true }
      );
      return normalizeToArray(res.data);
    },
    staleTime: 30_000,
  });

  const { items, metrics } = useMemo(() => {
    const all = q.data ?? [];

    // Filter berdasarkan status kalau bukan 'ALL'
    const filtered =
      status === 'ALL'
        ? all
        : all.filter(
            (i) => String(i.status).toUpperCase() === status.toUpperCase()
          );

    const sliced = filtered.slice(0, take);

    // === HITUNG METRICS ===
    const totalProducts = new Set(all.map((i) => i.product?.id)).size;
    const totalOrders = new Set(all.map((i) => i.orderId)).size;

    const completedOrders = new Set(
      all
        .filter((i) => String(i.status).toUpperCase() === 'COMPLETED')
        .map((i) => i.orderId)
    ).size;

    const totalRevenue = all
      .filter((i) =>
        ['DELIVERED', 'COMPLETED'].includes(String(i.status).toUpperCase())
      )
      .reduce(
        (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.price) || 0),
        0
      );

    return {
      items: sliced,
      metrics: { totalProducts, totalOrders, completedOrders, totalRevenue },
    };
  }, [q.data, status, take]);

  return {
    items, // DashboardOrderItem[]
    metrics, // DashboardMetrics
    isLoading: q.isLoading,
    isError: q.isError,
    error: q.error,
    refetch: q.refetch,
  };
}
