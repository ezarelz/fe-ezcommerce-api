export type SellerOrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'CANCELLED'
  | 'COMPLETED';

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

export type PaginatedOrders = {
  items: OrderItem[];
  total: number;
  page: number;
  pageSize: number;
};
