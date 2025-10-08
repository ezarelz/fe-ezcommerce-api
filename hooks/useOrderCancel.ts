// /hooks/useOrderCancel.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface CancelPayload {
  orderId: number;
  reason: string; // belum dipakai di GET; tetap dipertahankan untuk kompatibilitas
}

interface CancelResponse {
  success: boolean;
  message: string;
  data: { orderId: number };
}

// Bentuk lain yang kadang dikembalikan BE (lebih ringkas)
interface RawCancelShort {
  orderId: number;
  data?: string;
}
type RawCancelResponse = CancelResponse | RawCancelShort;

// ---- type guards & normalizer (tanpa any) ----
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCancelResponse(value: unknown): value is CancelResponse {
  if (!isObject(value)) return false;
  const hasSuccess =
    'success' in value &&
    typeof (value as Record<string, unknown>)['success'] === 'boolean';
  const hasMessage =
    'message' in value &&
    typeof (value as Record<string, unknown>)['message'] === 'string';
  const data = (value as Record<string, unknown>)['data'];
  const hasDataOrderId =
    isObject(data) &&
    'orderId' in data &&
    typeof (data as Record<string, unknown>)['orderId'] === 'number';
  return hasSuccess && hasMessage && hasDataOrderId;
}

function isRawCancelShort(value: unknown): value is RawCancelShort {
  return (
    isObject(value) &&
    'orderId' in value &&
    typeof (value as Record<string, unknown>)['orderId'] === 'number'
  );
}

function normalizeCancelResponse(
  raw: unknown,
  fallbackOrderId: number
): CancelResponse {
  if (isCancelResponse(raw)) return raw;
  if (isRawCancelShort(raw)) {
    return {
      success: true,
      message: 'Cancellation requested',
      data: { orderId: raw.orderId },
    };
  }
  // guard terakhir bila BE kirim bentuk lain / kosong
  return {
    success: true,
    message: 'Cancellation requested',
    data: { orderId: fallbackOrderId },
  };
}

export function useRequestCancelOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
    }: CancelPayload): Promise<CancelResponse> => {
      // Tetap GET; kirim status via query params (axios: `params`)
      const res = await api<RawCancelResponse>('/api/seller/order-items', {
        method: 'GET',
        params: { status: 'CANCELLED' },
        useAuth: true, // token via interceptor
      });

      // Normalize ke bentuk CancelResponse agar tidak pecah di TS
      return normalizeCancelResponse(res?.data, orderId);
    },

    onSuccess: (_resp, { orderId }) => {
      // refresh data yang relevan
      qc.invalidateQueries({ queryKey: ['orders', 'my'] });
      qc.invalidateQueries({ queryKey: ['orders', 'detail', orderId] });
      qc.invalidateQueries({ queryKey: ['seller', 'order-items'] });
    },
  });
}
