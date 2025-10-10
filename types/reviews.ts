// src/types/reviews.ts

/** Response envelope standar dari API */
export type ApiResp<T> = {
  success: boolean;
  message: string;
  data: T;
};

/** Satu review produk.
 *  Catatan:
 *  - Backend pakai `star` (wajib). Beberapa tempat mungkin kirim `rating`,
 *    jadi kita sediakan optional `rating?` untuk kompatibilitas.
 *  - `author` opsional agar buyer-side bisa menampilkan nama penulis,
 *    dan seller-side bisa melihat siapa yang mereview.
 *  - `product` berisi info ringkas produk agar mudah dirender di buyer-side.
 */
export type Review = {
  id: number;
  productId: number;
  star: number; // skor 1..5 (sumber utama)
  rating?: number; // alias opsional jika BE mengirim 'rating'
  comment: string;
  createdAt: string;

  author?: {
    // informasi penulis (opsional)
    id?: number;
    name?: string;
    avatarUrl?: string | null;
  };

  product?: {
    // informasi produk (opsional, untuk listing milik saya)
    id: number;
    name: string;
    image?: string | null;
    shopName?: string;
  };
};

/** Bentuk paginated yang distandarkan oleh hooks (toPaged) */
export type Paged<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

/** Item eligible = produk yang dibeli & COMPLETED tapi belum direview */
export type Eligible = {
  orderItemId: number;
  productId: number;
  productName: string;
  productImage?: string | null;
  completedAt: string;
};

/** ====== Tambahan untuk sisi SELLER (ringkasan per produk) ====== */
export type SellerSummaryItem = {
  productId: number;
  productName: string;
  productImage?: string | null;
  avgRating: number; // 0..5
  totalReview: number;
};

export type SellerSummaryResp = {
  items: SellerSummaryItem[];
  page: number;
  limit: number;
  total: number; // total keseluruhan review (akumulasi)
  avgAll: number; // rata-rata gabungan semua produk
};
