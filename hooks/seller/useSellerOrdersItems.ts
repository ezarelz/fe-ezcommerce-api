/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type SellerOrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'CANCELLED'
  | 'COMPLETED';

export type DashboardOrderItem = {
  id: number;
  orderId: number;
  code: string;
  qty: number;
  priceSnapshot: number;
  status: SellerOrderStatus;
  createdAt: string;
  product?: { id: number; title: string; images?: string[] };
  buyer?: { name?: string; phone?: string };
  shipping?: {
    method?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
};

export type DashboardMetrics = {
  totalProducts: number;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
};

type ApiResp<T> = { success: boolean; message: string; data: T };

function normalizeToArray(payload: any): DashboardOrderItem[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (payload?.data && typeof payload.data === 'object') return [payload.data];
  if (payload && typeof payload === 'object') return [payload];
  return [];
}

/**
 * Hook khusus dashboard:
 * - ambil semua order-items seller dari /api/seller/order-items
 * - hitung metrics akurat berdasarkan data nyata dari API
 */
export function useSellerOrderItems(opts?: {
  status?: SellerOrderStatus | 'ALL';
  take?: number;
}) {
  const { status = 'COMPLETED', take = 100 } = opts ?? {};

  const q = useQuery({
    queryKey: ['seller', 'order-items', { status, take }],
    queryFn: async (): Promise<DashboardOrderItem[]> => {
      const res = await api<ApiResp<any>>('/api/seller/order-items', {
        method: 'GET',
        useAuth: true,
      });
      return normalizeToArray(res.data);
    },
    staleTime: 30_000,
  });

  const { items, metrics } = useMemo(() => {
    const all = q.data ?? [];

    // filter sesuai status yang diminta (default COMPLETED)
    const filtered =
      status === 'ALL'
        ? all
        : all.filter((i) => String(i.status).toUpperCase() === 'COMPLETED');

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
      .filter((i) => String(i.status).toUpperCase() === 'COMPLETED')
      .reduce(
        (sum, i) =>
          sum + (Number(i.qty) || 0) * (Number(i.priceSnapshot ?? 0) || 0),
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
