'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, token } from '@/lib/api';

/* =============== Types =============== */
export type Role = boolean | 'buyer' | 'seller' | 'admin';

export type Me = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  isSeller?: boolean;
  isActive?: Role;
  stats?: {
    totalOrders: number;
    completedItems: number;
    hasShop: boolean;
  };
};

export type UpdateMeResponse = {
  success: boolean;
  message: string;
  user: Me;
};

/* =============== Query Keys =============== */
const qk = { me: ['me'] as const };

/* =============== Queries =============== */

/** ✅ GET /api/auth/me — ambil profil user */
export function useMe() {
  const enabled = !!token.get();

  return useQuery({
    queryKey: qk.me,
    enabled,
    queryFn: async (): Promise<Me> => {
      const res = await api<Me>('/api/auth/me', {
        method: 'GET',
        useAuth: true,
      });
      return res;
    },
    staleTime: 60_000,
    refetchInterval: 60_000, // refresh otomatis tiap 1 menit
    retry: false,
  });
}

/* =============== Mutations =============== */

/** ✅ PATCH /api/auth/me — update profile + avatar upload */
export function useUpdateMe() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: FormData | { name?: string; phone?: string }
    ) => {
      const isFormData = payload instanceof FormData;

      // ✅ Backend return format: { success, message, user }
      const res = await api<UpdateMeResponse>('/api/auth/me', {
        method: 'PATCH',
        useAuth: true,
        data: payload,
        headers: isFormData
          ? undefined // biar axios set multipart boundary otomatis
          : { 'Content-Type': 'application/json' },
      });

      return res.user;
    },
    onSuccess: (user) => {
      // ⏫ Langsung update cache /me agar tampilan realtime
      qc.setQueryData(qk.me, user);
    },
    onError: (err) => {
      console.error('❌ Failed to update profile:', err);
    },
  });
}

/** ✅ POST /api/auth/login — simpan token + refresh /me */
export function useLogin() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const res = await api<{ token: string }>('/api/auth/login', {
        method: 'POST',
        data: payload,
        useAuth: false,
      });
      return res;
    },
    onSuccess: (data) => {
      const tk = data?.token;
      if (!tk) {
        console.error('❌ Login response missing token:', data);
        return;
      }

      token.set(tk);
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

/** ✅ POST /api/auth/register */
export function useRegister() {
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      email: string;
      password: string;
    }) => {
      const res = await api('/api/auth/register', {
        method: 'POST',
        data: payload,
        useAuth: false,
      });
      return res;
    },
  });
}

/** ✅ Logout lokal */
export function useLogout() {
  const qc = useQueryClient();
  return () => {
    token.clear();
    qc.removeQueries({ queryKey: qk.me });
  };
}
