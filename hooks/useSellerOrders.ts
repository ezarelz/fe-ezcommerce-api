/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { OrderItem, SellerOrderStatus } from '@/types/seller-orders';

type ApiResp<T> = { success: boolean; message: string; data: T };

type ListParams = { page: number; limit: number; status?: SellerOrderStatus };

const qk = {
  list: (p: ListParams) =>
    ['sellerOrderItems', p.page, p.limit, p.status] as const,
};

/** Adapter: Swagger → FE OrderItem */
function toOrderItem(r: any): OrderItem {
  const qty = r.qty ?? 0;
  const unit = r.priceSnapshot ?? 0;
  const img =
    r.product?.images?.[0] ?? r.product?.imageUrl ?? r.imageUrl ?? null;

  return {
    id: r.id,
    status: r.status, // 'NEW' | 'CONFIRMED' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'
    invoice: r.code ?? null,
    createdAt: r.createdAt ?? null,
    productTitle: r.product?.title ?? '-',
    productImage: img,
    quantity: qty,
    unitPrice: unit,
    totalPrice: unit * qty,
    buyerName: r.buyer?.name ?? '',
    buyerPhone: r.buyer?.phone ?? '',
    shippingAddress: r.shipping?.address ?? '', // BE tidak ada di list → tetap aman
    shippingMethod: r.shipping?.method ?? '-',
  };
}

export function useSellerOrderItems(p: ListParams) {
  const qs = new URLSearchParams({
    page: String(p.page),
    limit: String(p.limit),
    ...(p.status ? { status: p.status } : {}),
  });

  return useQuery({
    queryKey: qk.list(p),
    queryFn: async () => {
      const res = await api<ApiResp<{ items: any[]; total: number }>>(
        `/api/seller/order-items?${qs.toString()}`,
        { method: 'GET', useAuth: true }
      );
      const itemsRaw = res.data.items ?? [];
      return {
        items: itemsRaw.map(toOrderItem),
        total: res.data.total ?? itemsRaw.length ?? 0,
      };
    },
  });
}

export function useUpdateOrderItemStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: 'CONFIRMED' | 'SHIPPED' | 'CANCELLED';
    }) => {
      const res = await api<{ success: boolean; message: string; data: any }>(
        `/api/seller/order-items/${id}/status`,
        {
          method: 'PATCH',
          useAuth: true,
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({ status }),
        }
      );
      if (!res?.success)
        throw new Error(res?.message || 'Update status failed');
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sellerOrderItems'] }),
  });
}
