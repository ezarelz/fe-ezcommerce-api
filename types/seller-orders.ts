/**
 * Status pesanan seller (sesuai BE)
 * 'PENDING' menggantikan 'NEW' atau 'CONFIRMED'
 */
export type SellerOrderStatus =
  | 'PENDING'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'COMPLETED';

/** Struktur satu item pesanan (order item yang dijual oleh seller) */
export type OrderItem = {
  id: number;
  invoice?: string;
  productTitle: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: SellerOrderStatus;
  buyerName?: string;
  buyerPhone?: string;
  shippingAddress?: string;
  shippingMethod?: string;
  createdAt?: string;
};

/** Struktur respons paginated */
export type PaginatedOrders = {
  items: OrderItem[];
  total: number;
  page: number;
  pageSize: number;
};
