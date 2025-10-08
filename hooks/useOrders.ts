'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { QK } from '@/constants/queryKeys';

/* ========== Types (pakai type aliases) ========== */

export type OrderStatus =
  | 'NEW'
  | 'PENDING'
  | 'PAID'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export type OrderSummary = {
  id: number;
  createdAt: string;
  status: OrderStatus;
  total: number;
  currency: 'IDR';
  shopName?: string | null;
};

export type OrdersList = {
  data: OrderSummary[];
  page?: number;
  limit?: number;
  total?: number;
};

export type OrderItem = {
  id: number;
  productId: number;
  title: string;
  imageUrl?: string | null;
  qty: number;
  price: number;
  status: OrderStatus;
  shopName?: string | null;
};

export type OrderAddress = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
};

export type OrderDetail = {
  id: number;
  createdAt: string;
  status: OrderStatus;
  paymentMethod?: string | null;
  notes?: string | null;
  items: OrderItem[];
  amounts: {
    subtotal: number;
    shipping: number;
    total: number;
    currency: 'IDR';
  };
  shippingAddress: OrderAddress;
};

/* ========== Type guards & normalizers ========== */

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null;

const isOrderSummary = (x: unknown): x is OrderSummary =>
  isObj(x) &&
  typeof x.id === 'number' &&
  typeof x.createdAt === 'string' &&
  typeof x.status === 'string' &&
  typeof x.total === 'number' &&
  x['currency'] === 'IDR';

const isOrdersList = (x: unknown): x is OrdersList =>
  isObj(x) && Array.isArray(x['data']) && x['data'].every(isOrderSummary);

const isOrderItem = (x: unknown): x is OrderItem =>
  isObj(x) &&
  typeof x.id === 'number' &&
  typeof x.productId === 'number' &&
  typeof x.title === 'string' &&
  typeof x.qty === 'number' &&
  typeof x.price === 'number' &&
  typeof x.status === 'string';

const isOrderDetail = (x: unknown): x is OrderDetail => {
  if (!isObj(x)) return false;
  const items = x['items'];
  const amounts = x['amounts'];
  const addr = x['shippingAddress'];
  return (
    typeof x['id'] === 'number' &&
    typeof x['createdAt'] === 'string' &&
    typeof x['status'] === 'string' &&
    Array.isArray(items) &&
    items.every(isOrderItem) &&
    isObj(amounts) &&
    typeof amounts['subtotal'] === 'number' &&
    typeof amounts['shipping'] === 'number' &&
    typeof amounts['total'] === 'number' &&
    amounts['currency'] === 'IDR' &&
    isObj(addr) &&
    typeof addr['fullName'] === 'string' &&
    typeof addr['phone'] === 'string' &&
    typeof addr['addressLine1'] === 'string' &&
    typeof addr['city'] === 'string' &&
    typeof addr['province'] === 'string' &&
    typeof addr['postalCode'] === 'string'
  );
};

const normalizeOrdersList = (raw: unknown): OrdersList =>
  isOrdersList(raw) ? raw : { data: [] };

const normalizeOrderDetail = (raw: unknown, id: number | string): OrderDetail =>
  isOrderDetail(raw)
    ? raw
    : {
        id: Number(id),
        createdAt: new Date().toISOString(),
        status: 'PENDING',
        paymentMethod: null,
        notes: null,
        items: [],
        amounts: { subtotal: 0, shipping: 0, total: 0, currency: 'IDR' },
        shippingAddress: {
          fullName: '',
          phone: '',
          addressLine1: '',
          city: '',
          province: '',
          postalCode: '',
        },
      };

/* ========== Queries ========== */

/** GET /api/orders/my */
export function useOrders(opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 10;

  return useQuery({
    queryKey: [...QK.orders(), { page, limit }],
    queryFn: async (): Promise<OrdersList> => {
      // ⬇ penting: destructuring { data } → tidak mungkin "property 'data' does not exist"
      const { data } = await api<OrdersList>('/api/orders/my', {
        method: 'GET',
        params: { page, limit },
        useAuth: true,
      });
      return normalizeOrdersList(data);
    },

    staleTime: 30_000,
  });
}

/** GET /api/orders/{id} */
export function useOrderDetail(orderId: number | string | null) {
  return useQuery({
    enabled: !!orderId,
    queryKey: [...QK.orders(), orderId],
    queryFn: async (): Promise<OrderDetail> => {
      const { data } = await api<OrdersList>(`/api/orders/${orderId}`, {
        method: 'GET',
        useAuth: true,
      });
      return normalizeOrderDetail(data, orderId as number | string);
    },
    staleTime: 30_000,
  });
}

/* ========== Mutation: PATCH /api/orders/items/{id}/complete ========== */

export type CompleteResp = {
  success: boolean;
  message: string;
  data: { id: number; status: OrderStatus };
};

const isCompleteResp = (x: unknown): x is CompleteResp =>
  isObj(x) &&
  x['success'] === true &&
  typeof x['message'] === 'string' &&
  isObj(x['data']) &&
  typeof x['data']['id'] === 'number' &&
  typeof x['data']['status'] === 'string';

const normalizeCompleteResp = (raw: unknown, id: number): CompleteResp =>
  isCompleteResp(raw)
    ? raw
    : {
        success: true,
        message: 'Order item marked as COMPLETED',
        data: { id, status: 'COMPLETED' },
      };

export function useCompleteOrderItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (orderItemId: number): Promise<CompleteResp> => {
      const { data } = await api<OrdersList>(
        `/api/orders/items/${orderItemId}/complete`,
        {
          method: 'PATCH',
          useAuth: true,
        }
      );
      return normalizeCompleteResp(data, orderItemId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.orders() });
    },
  });
}
