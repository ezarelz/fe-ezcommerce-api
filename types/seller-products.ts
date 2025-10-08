export type SellerProduct = {
  id: number;
  title: string;
  description?: string | null;
  price: number;
  stock: number;
  categoryId: number;
  images: string[]; // URLs dikembalikan BE
  imagesUrl?: string[]; // opsional
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreateProductInput = {
  title: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: number;
  images?: File[]; // array file utk multipart
  imagesUrl?: string[]; // kalau tidak upload file
  isActive?: boolean;
};

export type UpdateProductInput = Partial<CreateProductInput> & {
  /** true => gabung gambar baru dengan yang lama; false/omit => replace */
  merge?: boolean;
};
