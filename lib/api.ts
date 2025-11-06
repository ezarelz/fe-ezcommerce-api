/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/api.ts
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosHeaders,
} from 'axios';
import type { ApiResp, Paged, Review } from '@/types/reviews';

/* ==========================================================
   BASE URL SETUP
   ========================================================== */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'http://localhost:4000';

/* ==========================================================
   TOKEN HELPER
   ========================================================== */
export const TOKEN_KEY = 'token';
export const token = {
  get: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  set: (t: string) => {
    if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, t);
  },
  clear: () => {
    if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
  },
};

/* ==========================================================
   AXIOS INSTANCE
   ========================================================== */
// NOTE: jangan set Content-Type default di instance (bisa ganggu FormData)
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
});

/* ==========================================================
   CUSTOM CONFIG TYPE
   ========================================================== */
export type ApiInit = AxiosRequestConfig & {
  useAuth?: boolean;
};

/* ==========================================================
   REQUEST INTERCEPTOR
   ========================================================== */
apiClient.interceptors.request.use((config) => {
  const init = config as ApiInit;

  // Inject Bearer token jika useAuth true
  if (init.useAuth) {
    const t = token.get();
    if (t) {
      if (!config.headers) config.headers = new AxiosHeaders();

      // Set Authorization header
      if (config.headers instanceof AxiosHeaders) {
        config.headers.set('Authorization', `Bearer ${t}`);
      } else {
        (config.headers as Record<string, string>)[
          'Authorization'
        ] = `Bearer ${t}`;
      }

      // 🔍 Debug: pastikan token dikirim
      if (process.env.NODE_ENV === 'development') {
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ [API] useAuth = true but no token found in localStorage'
      );
    }
  }

  // Deteksi FormData
  const isFormData =
    typeof config.data !== 'undefined' &&
    typeof FormData !== 'undefined' &&
    config.data instanceof FormData;

  if (!isFormData) {
    // Untuk JSON (object / string)
    if (!config.headers) config.headers = new AxiosHeaders();
    if (config.headers instanceof AxiosHeaders) {
      if (!config.headers.has('Content-Type')) {
        config.headers.set('Content-Type', 'application/json');
      }
    } else {
      (config.headers as Record<string, string>)['Content-Type'] ??=
        'application/json';
    }
  } else {
    // Biarkan axios set boundary untuk FormData
    if (config.headers instanceof AxiosHeaders) {
      config.headers.delete('Content-Type');
    } else if (config.headers) {
      delete (config.headers as Record<string, string>)['Content-Type'];
    }
  }

  return config;
});

/* ==========================================================
   GENERIC REQUEST HELPER
   ========================================================== */
export async function api<T>(path: string, init?: ApiInit): Promise<T> {
  try {
    const res = await apiClient.request<T>({
      url: path,
      ...init,
    });

    return res.data;
  } catch (err) {
    const e = err as AxiosError<{ message?: string; error?: string }>;
    const status = e.response?.status;
    const serverMsg =
      e.response?.data?.message || e.response?.data?.error || e.message;

    // Log lebih detail saat dev
    if (process.env.NODE_ENV === 'development') {
      console.error(
        `❌ [API ERROR] ${init?.method?.toUpperCase() || 'GET'} ${path}`,
        status ? `→ ${status}` : '',
        '\n',
        e.response?.data || e.message
      );
    }

    // Buat error yang rapi
    throw new Error(
      serverMsg || `Request failed${status ? `: ${status}` : ''}`
    );
  }
}

/* ==========================================================
   UTIL QUERY STRING
   ========================================================== */
function qs(params?: Record<string, string | number | undefined>): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) usp.set(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

/* ==========================================================
   PRODUCT HELPERS
   ========================================================== */
import type {
  ApiProduct,
  ApiProductsResponse,
  ApiProductDetailResponse,
  ApiProductDetail,
} from '@/types/products';

export async function getProducts(args?: {
  limit?: number;
  cursor?: string | number | null;
  q?: string;
  category?: string;
  sellerId?: number | string;
  ids?: number[];
}): Promise<ApiProduct[]> {
  const query = qs({
    limit: args?.limit,
    cursor: args?.cursor ?? undefined,
    q: args?.q,
    category: args?.category,
    sellerId: args?.sellerId,
    ids: args?.ids?.length ? args.ids.join(',') : undefined,
  });

  const resp = await api<ApiProductsResponse>(`/api/products${query}`, {
    method: 'GET',
  });
  if (!resp.success) throw new Error(resp.message);
  return resp.data.products;
}

export async function getProductsPage(args?: {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  sellerId?: number | string;
  ids?: number[];
}): Promise<ApiProductsResponse> {
  const query = qs({
    page: args?.page ?? 1,
    limit: args?.limit ?? 20,
    q: args?.q,
    category: args?.category,
    sellerId: args?.sellerId,
    ids: args?.ids?.length ? args.ids.join(',') : undefined,
  });

  const resp = await api<ApiProductsResponse>(`/api/products${query}`, {
    method: 'GET',
  });
  if (!resp.success) throw new Error(resp.message);
  return resp;
}

export async function getProductsList(
  args?: Omit<
    {
      page?: number;
      limit?: number;
      q?: string;
      category?: string;
      sellerId?: number | string;
      ids?: number[];
    },
    'page'
  >
): Promise<ApiProduct[]> {
  const res = await getProductsPage({ ...args, page: 1 });
  return res.data.products;
}

export async function getProductById(
  id: number | string
): Promise<ApiProductDetail> {
  const resp = await api<ApiProductDetailResponse>(`/api/products/${id}`, {
    method: 'GET',
  });
  if (!resp.success) throw new Error(resp.message);
  return resp.data;
}

export async function getRelatedProducts(
  categoryId: number,
  excludeId: number,
  limit = 4
): Promise<ApiProduct[]> {
  const products = await getProductsList({
    category: String(categoryId),
    limit,
  });
  return products.filter((p) => p.id !== excludeId);
}

/* ==========================================================
   REVIEW HELPERS (SELLER & BUYER)
   ========================================================== */

/**
 * Ambil semua review untuk satu produk (seller view)
 * GET /api/reviews/product/{productId}?page=...&limit=...
 */
export async function getProductReviewsById(
  productId: number,
  page = 1,
  limit = 50
): Promise<Review[]> {
  const query = qs({ page, limit });

  const resp = await api<ApiResp<Paged<Review> | Review[]>>(
    `/api/reviews/product/${productId}${query}`,
    { method: 'GET', useAuth: true }
  );

  // Normalisasi struktur BE (kadang Paged, kadang array langsung)
  const data =
    (resp as any)?.data?.items ??
    (Array.isArray((resp as any)?.data) ? (resp as any)?.data : []) ??
    [];

  return data;
}
