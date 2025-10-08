'use client';

import { useState } from 'react';
import Image from 'next/image';
import SellerShell from '@/components/seller/SellerShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ProductForm from '@/components/seller/ProductForm';
import DeleteProductDialog from '@/components/seller/DeleteProductDialog';
import {
  useSellerProducts,
  useCreateSellerProduct,
  useUpdateSellerProduct,
  useDeleteSellerProduct,
} from '@/hooks/useSellerProducts';
import type { SellerProduct } from '@/types/seller-products';

export default function Page() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const pageSize = 10;

  const { data, isLoading } = useSellerProducts(page, pageSize, q);
  const createMut = useCreateSellerProduct();
  const updateMut = useUpdateSellerProduct();
  const deleteMut = useDeleteSellerProduct();

  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

  return (
    <SellerShell title='Products'>
      {/* Header row */}
      <div className='mb-4 flex items-center justify-between'>
        <Dialog>
          <DialogTrigger asChild>
            <Button size='sm'>+ Add Product</Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
            </DialogHeader>
            <ProductForm
              mode='create'
              onSubmit={(payload) => createMut.mutate(payload)}
              isSubmitting={createMut.isPending}
            />
          </DialogContent>
        </Dialog>

        <div className='w-64'>
          <Input
            placeholder='Search'
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className='rounded-xl border bg-white'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-zinc-50 text-zinc-600'>
              <tr>
                <th className='px-4 py-3 text-left w-12'>No</th>
                <th className='px-4 py-3 text-left'>Product</th>
                <th className='px-4 py-3 text-left'>Price</th>
                <th className='px-4 py-3 text-left'>Stock</th>
                <th className='px-4 py-3 text-left w-40'>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className='px-4 py-10 text-center text-zinc-500'
                  >
                    Loading...
                  </td>
                </tr>
              )}

              {!isLoading &&
                items.map((p: SellerProduct, idx) => (
                  <tr key={p.id} className='border-t'>
                    <td className='px-4 py-3'>
                      {(page - 1) * pageSize + idx + 1}
                    </td>

                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        <Image
                          src={p.images?.[0] ?? '/placeholder.png'}
                          alt={p.title}
                          width={40}
                          height={40}
                          className='rounded-md object-cover'
                        />
                        <div className='min-w-0'>
                          <div className='font-medium truncate'>{p.title}</div>
                          <div className='text-xs text-zinc-500 truncate'>
                            Cat #{p.categoryId} ·{' '}
                            {p.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className='px-4 py-3'>
                      Rp{p.price.toLocaleString('id-ID')}
                    </td>

                    <td className='px-4 py-3'>{p.stock}</td>

                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-2'>
                        {/* Edit */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <button
                              className='p-2 rounded-md hover:bg-zinc-100'
                              aria-label='Edit'
                            >
                              <Image
                                src='/icons/edit-ico.svg'
                                alt='edit'
                                width={16}
                                height={16}
                              />
                            </button>
                          </DialogTrigger>
                          <DialogContent className='sm:max-w-lg'>
                            <DialogHeader>
                              <DialogTitle>Edit Product</DialogTitle>
                            </DialogHeader>
                            <ProductForm
                              mode='edit'
                              defaultValues={p}
                              onSubmit={(payload) =>
                                updateMut.mutate({ id: p.id, input: payload })
                              }
                              isSubmitting={updateMut.isPending}
                            />
                          </DialogContent>
                        </Dialog>

                        {/* Delete */}
                        <DeleteProductDialog
                          onConfirm={async () => {
                            await deleteMut.mutateAsync(p.id); // ✅ fix type promise
                          }}
                          loading={deleteMut.isPending}
                        >
                          <button
                            className='p-2 rounded-md hover:bg-rose-50'
                            aria-label='Delete'
                          >
                            <Image
                              src='/icons/trash-seller.svg'
                              alt='delete'
                              width={16}
                              height={16}
                            />
                          </button>
                        </DeleteProductDialog>
                      </div>
                    </td>
                  </tr>
                ))}

              {!isLoading && items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className='px-4 py-12 text-center text-zinc-500'
                  >
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className='flex items-center justify-end gap-2 px-4 py-3 border-t'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <div className='text-sm px-2'>
            Page {page} / {totalPages}
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </SellerShell>
  );
}
