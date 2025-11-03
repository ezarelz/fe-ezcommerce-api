/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { OrderItem, SellerOrderStatus } from '@/types/seller-orders';

type ApiResp<T> = { success: boolean; message: string; data: T };
type ListParams = { page: number; limit: number; status?: SellerOrderStatus };

const qk = {
  list: (p: ListParams) =>
    ['sellerOrderItems', p.page, p.limit, p.status ?? 'ALL'] as const,
};

/* ============================================================
   ✅ Adapter BE → FE
   BE return: { success, message, data: [ { id, product, order, ... } ] }
=============================================================== */
function toOrderItem(r: any): OrderItem {
  const product = r.product ?? {};
  const order = r.order ?? {};
  const user = order.user ?? {};

  const quantity = r.quantity ?? 0;
  const unitPrice = r.price ?? product.price ?? 0;

  return {
    id: r.id,
    invoice: `INV-${order.id ?? r.id}`,
    status: r.status, // "PENDING" | "DELIVERED" | "COMPLETED" | "CANCELLED"
    createdAt: order.createdAt ?? null,

    productTitle: product.title ?? '-',
    productImage: product.images?.[0] ?? '/placeholder.png',
    quantity,
    unitPrice,
    totalPrice: quantity * unitPrice,

    buyerName: user.name ?? '-',
    buyerPhone: user.phone ?? '', // BE belum kirim → fallback kosong string
    shippingAddress: order.address ?? '-', // 🟢 ditarik dari BE baru
    shippingMethod: order.shipping ?? '-', // 🟢 ditarik dari BE baru
  };
}

/* ============================================================
   ✅ GET /api/seller-fulfillment/order-items
=============================================================== */
export function useSellerOrderItems(p: ListParams) {
  const qs = new URLSearchParams({
    page: String(p.page),
    limit: String(p.limit),
    ...(p.status ? { status: p.status } : {}),
  });

  return useQuery({
    queryKey: qk.list(p),
    queryFn: async () => {
      const res = await api<ApiResp<any[]>>(
        `/api/seller-fulfillment/order-items?${qs.toString()}`,
        { method: 'GET', useAuth: true }
      );

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to fetch order items');
      }

      const itemsRaw = res.data ?? [];
      return {
        items: itemsRaw.map(toOrderItem),
        total: itemsRaw.length,
      };
    },
  });
}

/* ============================================================
   ✅ PATCH /api/seller-fulfillment/order-items/:id/status
=============================================================== */
export function useUpdateOrderItemStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: 'DELIVERED' | 'CANCELLED';
    }) => {
      const res = await api<ApiResp<any>>(
        `/api/seller-fulfillment/order-items/${id}/status`,
        {
          method: 'PATCH',
          useAuth: true,
          headers: { 'Content-Type': 'application/json' },
          data: { status },
        }
      );

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to update order status');
      }

      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sellerOrderItems'] });
    },
  });
}
