'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, token } from '@/lib/api';

export type Role = boolean | 'buyer' | 'seller' | 'admin';
export type Me = {
  id: string;
  name: string;
  email: string;
  isActive?: Role;
  avatarUrl?: string;
  stats?: { totalOrders: number; completedItems: number; hasShop: boolean };
};

type ApiResp<T> = { success: boolean; message: string; data: T };

const qk = { me: ['me'] as const };

/** GET /api/me — unwrap data */
export function useMe() {
  const enabled = !!token.get();
  return useQuery({
    queryKey: qk.me,
    enabled,
    queryFn: async (): Promise<Me> => {
      const res = await api<ApiResp<Me>>('/api/me', {
        method: 'GET',
        useAuth: true,
      });
      return res.data; // <-- penting
    },
    staleTime: 60_000,
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name?: string;
      phone?: string;
      avatarUrl?: string;
    }) => {
      const res = await api<ApiResp<Me>>('/api/me', {
        method: 'PATCH',
        useAuth: true,
        data,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}
/** POST /api/auth/login — simpan token + refresh /me */
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const res = await api<ApiResp<{ token: string; user: Me }>>(
        '/api/auth/login',
        { method: 'POST', data: payload, useAuth: false }
      );
      return res.data; // { token, user }
    },
    onSuccess: ({ token: tk }) => {
      token.set(tk);
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

/** POST /api/auth/register */
export function useRegister() {
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      email: string;
      password: string;
    }) => {
      const res = await api<ApiResp<unknown>>('/api/auth/register', {
        method: 'POST',
        data: payload,
        useAuth: false,
      });
      return res.data;
    },
  });
}

/** Logout lokal */
export function useLogout() {
  const qc = useQueryClient();
  return () => {
    token.clear();
    qc.removeQueries({ queryKey: qk.me });
  };
}
