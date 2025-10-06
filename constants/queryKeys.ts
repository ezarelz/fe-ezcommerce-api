// src/constants/queryKeys.ts
export const QK = {
  products: (params?: unknown) => ['products', params] as const,
  product: (id: string | number) => ['product', id] as const,
  cart: () => ['cart'] as const,
  me: () => ['me'] as const,
  orders: () => ['orders'] as const,
};
