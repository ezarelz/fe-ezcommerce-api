// src/lib/transform.ts
import type { ApiProduct, ProductCardVM } from '@/types/products';

export function toProductCardVM(p: ApiProduct): ProductCardVM {
  return {
    id: p.id,
    name: p.title, // FE pakai "name" untuk display
    price: p.price,
    imageUrl: p.images?.[0],
    rating: p.rating,
    shopName: p.shop?.name,
  };
}
