// src/lib/api.ts
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosHeaders,
} from 'axios';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

// =============== Token helper ===============
export const TOKEN_KEY = 'token';
export const token = {
  get: () =>
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  set: (t: string) =>
    typeof window !== 'undefined' && localStorage.setItem(TOKEN_KEY, t),
  clear: () =>
    typeof window !== 'undefined' && localStorage.removeItem(TOKEN_KEY),
};

// =============== Axios instance ===============
export type ApiInit = AxiosRequestConfig & { useAuth?: boolean }; // <-- rename flag

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Inject Bearer token hanya jika useAuth = true
apiClient.interceptors.request.use((config) => {
  const init = config as ApiInit;
  if (init.useAuth) {
    const t = token.get();
    if (t) {
      if (!config.headers) config.headers = new AxiosHeaders();
      if (config.headers instanceof AxiosHeaders) {
        config.headers.set('Authorization', `Bearer ${t}`);
      } else {
        (config.headers as Record<string, string>)[
          'Authorization'
        ] = `Bearer ${t}`;
      }
    }
  }
  return config;
});

// =============== Generic request helper ===============
export async function api<T>(path: string, init?: ApiInit): Promise<T> {
  try {
    const res = await apiClient.request<T>({ url: path, ...init });
    return res.data;
  } catch (err) {
    const e = err as AxiosError<{ message?: string }>;
    const msg =
      e.response?.data?.message ||
      e.message ||
      `Request failed${e.response ? `: ${e.response.status}` : ''}`;
    throw new Error(msg);
  }
}

// =============== Utils ===============
function qs(params?: Record<string, string | number | undefined>): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) usp.set(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

// =============== E-commerce endpoints (opsional) ===============
import type {
  ApiProduct,
  ApiProductsResponse,
  ApiProductDetailResponse,
  ApiProductDetail,
} from '@/types/products';

/** GET /api/products -> flatten ke ApiProduct[] */
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

/** GET /api/products/{id} -> ApiProductDetail */
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
  const products = await getProducts({ category: String(categoryId), limit });
  return products.filter((p) => p.id !== excludeId);
}
