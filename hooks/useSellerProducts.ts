'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  SellerProduct,
  Paginated,
  CreateProductInput,
  UpdateProductInput,
} from '@/types/seller-products';
import { api } from '@/lib/api';

/* =============== Shared types =============== */
type ApiResp<T> = {
  success: boolean;
  message: string;
  data: T;
};

type BEListResp = {
  products: SellerProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/* =============== Query keys =============== */
const qk = {
  list: (page: number, limit: number, q: string) =>
    ['seller-products', 'list', { page, limit, q }] as const,
  detail: (id: number) => ['seller-products', 'detail', id] as const,
};

/* =============== Helpers =============== */
function appendIfDefined(fd: FormData, key: string, value: unknown) {
  if (value !== undefined && value !== null) fd.append(key, String(value));
}
function appendStringArray(fd: FormData, key: string, arr?: string[]) {
  if (!arr) return;
  for (const v of arr) fd.append(key, v);
}
function appendFiles(fd: FormData, key: string, files?: File[]) {
  if (!files) return;
  for (const f of files) fd.append(key, f);
}

function toFormData(input: CreateProductInput | UpdateProductInput): FormData {
  const fd = new FormData();
  appendIfDefined(fd, 'title', input.title);
  appendIfDefined(fd, 'description', input.description);
  appendIfDefined(fd, 'price', input.price);
  appendIfDefined(fd, 'stock', input.stock);
  appendIfDefined(fd, 'categoryId', input.categoryId);
  if (typeof input.isActive === 'boolean')
    fd.append('isActive', String(input.isActive));
  appendFiles(fd, 'images', input.images);
  appendStringArray(fd, 'imagesUrl', input.imagesUrl);
  return fd;
}

/* =============== Queries =============== */
export function useSellerProducts(page = 1, pageSize = 10, q = '') {
  return useQuery({
    queryKey: qk.list(page, pageSize, q),
    queryFn: async (): Promise<Paginated<SellerProduct>> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (q.trim()) params.set('q', q.trim());

      const res = await api<ApiResp<BEListResp>>(
        `/api/seller/products?${params.toString()}`,
        { method: 'GET', useAuth: true }
      );

      if (!res.success) throw new Error(res.message);
      const { products, pagination } = res.data;
      return {
        items: products,
        total: pagination.total,
        page: pagination.page,
        pageSize: pagination.limit,
      };
    },
  });
}

/* =============== Mutations =============== */
export function useCreateSellerProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProductInput): Promise<SellerProduct> => {
      const hasFiles = Array.isArray(input.images) && input.images.length > 0;
      const hasUrls =
        Array.isArray(input.imagesUrl) && input.imagesUrl.length > 0;
      if (!hasFiles && !hasUrls)
        throw new Error('Please add at least one image (upload or URL).');
      if (!input.categoryId || input.categoryId <= 0)
        throw new Error('categoryId must be a positive integer.');

      const form = toFormData(input);
      const res = await api<ApiResp<SellerProduct>>('/api/seller/products', {
        method: 'POST',
        data: form, // ✅ pakai data, bukan body
        useAuth: true,
      });

      return res.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === 'seller-products',
      }),
  });
}

export function useUpdateSellerProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: number;
      input: UpdateProductInput;
    }): Promise<SellerProduct> => {
      const form = toFormData(vars.input);
      const res = await api<ApiResp<SellerProduct>>(
        `/api/seller/products/${vars.id}`,
        {
          method: 'PUT',
          data: form, // ✅ pakai data
          useAuth: true,
        }
      );
      return res.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === 'seller-products',
      });
    },
  });
}

export function useDeleteSellerProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<{ id: number }> => {
      const res = await api<ApiResp<{ id: number }>>(
        `/api/seller/products/${id}`,
        {
          method: 'DELETE',
          useAuth: true,
        }
      );
      return res.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === 'seller-products',
      }),
  });
}
