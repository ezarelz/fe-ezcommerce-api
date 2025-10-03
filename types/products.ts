// types/product.ts
export type ApiProduct = {
  id: number;
  title: string;
  slug: string;
  price: number;
  stock: number;
  images: string[];
  rating: number;
  reviewCount: number;
  soldCount: number;
  category: { id: number; name: string; slug: string };
  shop: { id: number; name: string; slug: string };
};

export type ProductCardVM = {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  rating?: number;
  shopName?: string;
};

export type RelatedProductVM = {
  id: number;
  title: string;
  price: number;
  imageUrl?: string;
  rating?: number;
  shopName?: string;
};

export type ApiProductsResponse = {
  success: boolean;
  message: string;
  data: { products: ApiProduct[] };
};

// ADD these for detail:
export type ApiProductDetail = ApiProduct & {
  description?: string;
  isActive?: boolean;
  reviews?: [];
};

export type Review = {
  id: number;
  rating: number;
  comment?: string;
  createdAt?: string;
  // backend belum expose user? boleh minimal begini:
  user?: { name?: string; avatarUrl?: string };
};

export type ApiProductDetailResponse = {
  success: boolean;
  message: string;
  // IMPORTANT: detail returns the product object directly (not { product })
  data: ApiProductDetail;
};
