// src/types/reviews.ts

/** Response envelope standar dari API */
export type ApiResp<T> = {
  success: boolean;
  message?: string;
  data: T;
};

/** Review milik user */
export type Review = {
  id: number;
  productId: number;
  star: number;
  rating?: number;
  comment: string;
  createdAt: string;
  author?: {
    id?: number;
    name?: string;
    avatarUrl?: string | null;
  };
  product?: {
    id: number;
    title?: string;
    name?: string;
    images?: string[];
    shop?: { id?: number; name?: string };
  };
};

/** Struktur paginated standar */
export type Paged<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

/** Item eligible = produk yang dibeli & COMPLETED tapi belum direview */
export type Eligible = {
  productId: number;
  name: string;
  images?: string[]; // gunakan array
  image?: string; // tetap boleh ada jika hooks mengisi single image (backwards compat)
  shop?: { id?: number; name?: string };
  shopName?: string; // backward compat if you earlier used shopName
  price?: number;
};

/** Ringkasan review untuk sisi SELLER */
export type SellerSummaryItem = {
  productId: number;
  productName: string;
  productImage?: string | null;
  avgRating: number;
  totalReview: number;
};

export type SellerSummaryResp = {
  items: SellerSummaryItem[];
  page: number;
  limit: number;
  total: number;
  avgAll: number;
};
