// types/cart.ts

export type CategoryLite = {
  id: number | string;
  name: string;
  slug: string;
};

export type ShopLite = {
  id?: number | string;
  name?: string;
  slug?: string;
  logo?: string | null;
};

export type CartProduct = {
  id: number | string;
  title?: string;
  name?: string;
  slug?: string;
  price: number;
  stock?: number;
  images?: string[];
  imageUrl?: string | null;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  category?: CategoryLite;
  shop?: ShopLite;
};

export type CartItem = {
  id: string;
  product: CartProduct;
  quantity: number;
  lineTotal?: number;
};

export type CartResponse = {
  items: CartItem[];
  subtotal?: number;
  grandTotal?: number;
};

// payloads + helpers (tidak berubah)…

// ===== Payloads
export type AddCartItemRequest = {
  productId: number | string;
  quantity: number;
};

export type UpdateCartItemQtyRequest = {
  cartItemId: string;
  quantity: number;
};

export type RemoveCartItemRequest = {
  cartItemId: string;
};

// ===== Helpers aman tanpa any
export function getProductTitle(p: CartProduct): string {
  return p.title ?? p.name ?? 'Product';
}
export function getProductImage(p: CartProduct): string | undefined {
  return p.images?.[0] ?? p.imageUrl ?? undefined;
}
export function getShopName(p: CartProduct): string {
  return p.shop?.name ?? 'Toko Default';
}
export function getShopSlug(p: CartProduct): string | undefined {
  return p.shop?.slug;
}
export function getUnitPrice(p: CartProduct): number {
  const price = Number(p.price ?? 0);
  return Number.isFinite(price) ? price : 0;
}
export function calcLineTotal(item: CartItem): number {
  return getUnitPrice(item.product) * Number(item.quantity ?? 1);
}
export function calcCartTotal(items: CartItem[]): number {
  return items.reduce((s, it) => s + calcLineTotal(it), 0);
}
