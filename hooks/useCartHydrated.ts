// src/hooks/useCartHydrated.ts
'use client';

import { useQueries } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { QK } from '@/constants/queryKeys';
import { useCart } from '@/hooks/useCart';
import type {
  CartResponse,
  CartItem,
  CartProduct,
  ShopLite,
} from '@/types/cart';

type ProductDetail = Partial<CartProduct> & { id: number | string };

export function useCartHydrated() {
  const cartQuery = useCart();

  const ids = (cartQuery.data?.items ?? [])
    .map((it) => it.product?.id)
    .filter((x): x is number | string => x !== undefined && x !== null);

  const productQueries = useQueries({
    queries: ids.map((id) => ({
      queryKey: QK.product(id),
      queryFn: async (): Promise<ProductDetail> => {
        const res = await apiClient.get(`/api/products/${id}`);
        return (res.data?.data ?? res.data) as ProductDetail;
      },
      enabled: !!cartQuery.data,
      staleTime: 60_000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    })),
  });

  const idToDetail = new Map<string, ProductDetail | undefined>();
  ids.forEach((id, i) => idToDetail.set(String(id), productQueries[i]?.data));

  const hydratedItems: CartItem[] = (cartQuery.data?.items ?? []).map((it) => {
    const detail = idToDetail.get(String(it.product?.id));

    const mergedShop: ShopLite | undefined =
      detail?.shop || it.product.shop
        ? {
            id: detail?.shop?.id ?? it.product.shop?.id,
            name: detail?.shop?.name ?? it.product.shop?.name ?? 'Toko',
            slug: detail?.shop?.slug ?? it.product.shop?.slug,
            logo: detail?.shop?.logo ?? it.product.shop?.logo,
          }
        : undefined;

    const mergedProduct: CartProduct = {
      ...it.product,
      ...detail,
      images: detail?.images?.length ? detail.images : it.product.images,
      imageUrl: detail?.imageUrl ?? it.product.imageUrl,
      shop: mergedShop,
      price: Number(detail?.price ?? it.product.price ?? 0),
      title: detail?.title ?? it.product.title ?? it.product.name,
    };

    return { ...it, product: mergedProduct };
  });

  const hydratedData: CartResponse | undefined = cartQuery.data
    ? { ...cartQuery.data, items: hydratedItems }
    : undefined;

  const isHydrating = productQueries.some((q) => q.isLoading);
  const isHydrateError = productQueries.some((q) => q.isError);

  return {
    ...cartQuery,
    data: hydratedData,
    isLoading: cartQuery.isLoading,
    isHydrating,
    isError: cartQuery.isError || isHydrateError,
  };
}
