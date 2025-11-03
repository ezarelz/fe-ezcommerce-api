'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import SellerShell from '@/components/seller/SellerShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useSellerOrderItems,
  useUpdateOrderItemStatus,
} from '@/hooks/useSellerOrders';
import type { OrderItem, SellerOrderStatus } from '@/types/seller-orders';

const formatRupiah = (n?: number | null) =>
  `Rp${(n ?? 0).toLocaleString('id-ID')}`;

// Tab filters
const ORDER_TABS: Array<{
  key: 'ALL' | SellerOrderStatus | 'COMPLETED';
  label: string;
}> = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'PENDING', label: 'New' }, // ✅ ganti dari NEW → PENDING
  { key: 'DELIVERED', label: 'Delivered' }, // ✅ tetap sesuai BE
  { key: 'COMPLETED', label: 'Completed' }, // ✅ tetap sesuai BE
  { key: 'CANCELLED', label: 'Cancelled' }, // ✅ tetap sesuai BE
];

function StatusBadge({
  status,
}: {
  status: OrderItem['status'] | 'COMPLETED';
}) {
  const colorMap: Record<string, string> = {
    NEW: 'bg-zinc-100 text-zinc-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    SHIPPED: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-rose-100 text-rose-700',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
        colorMap[status] || ''
      }`}
    >
      {status}
    </span>
  );
}

/**
 * Row Actions - sesuai dengan BE flow:
 * - NEW → bisa CONFIRM / CANCEL
 * - CONFIRMED → bisa SHIP
 * - SHIPPED → otomatis jadi COMPLETED oleh sistem (atau buyer)
 */

function RowActions({ item }: { item: OrderItem }) {
  const { mutate, isPending } = useUpdateOrderItemStatus();

  // hanya izinkan status yang bisa dikirim ke BE
  const updateStatus = (next: 'DELIVERED' | 'CANCELLED') => {
    mutate({ id: item.id, status: next });
  };

  // tombol aksi hanya muncul jika status masih PENDING
  if (item.status === 'PENDING') {
    return (
      <div className='flex gap-2'>
        {/* Reject Order */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant='outline' size='sm' disabled={isPending}>
              Reject
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject this order?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>
                Keep Order
              </AlertDialogCancel>
              <AlertDialogAction
                className='bg-rose-600 hover:bg-rose-700'
                onClick={() => updateStatus('CANCELLED')}
                disabled={isPending}
              >
                Reject Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Mark as Delivered */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size='sm'
              className='bg-black text-white hover:bg-black/90'
              disabled={isPending}
            >
              Mark Delivered
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm delivery?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => updateStatus('DELIVERED')}
                disabled={isPending}
              >
                Mark as Delivered
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // selain PENDING, tidak ada aksi
  return null;
}

export default function SellerOrdersPage() {
  const [tab, setTab] = useState<(typeof ORDER_TABS)[number]['key']>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const statusParam = tab === 'ALL' || tab === 'COMPLETED' ? undefined : tab;
  const { data, isLoading } = useSellerOrderItems({
    page,
    limit,
    status: statusParam,
  });

  const items = useMemo(() => {
    let list = data?.items ?? [];
    if (tab === 'COMPLETED')
      list = list.filter((it) => it.status === 'COMPLETED');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (it) =>
          it.productTitle?.toLowerCase().includes(q) ||
          it.buyerName?.toLowerCase().includes(q) ||
          it.invoice?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data?.items, search, tab]);

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / limit));

  return (
    <SellerShell title='Orders'>
      {/* Tabs + Search */}
      <div className='mb-4 flex items-center justify-between gap-3'>
        <div className='flex gap-2 overflow-x-auto'>
          {ORDER_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 text-sm ${
                tab === t.key
                  ? 'bg-black text-white'
                  : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Input
          placeholder='Search'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='w-64'
        />
      </div>

      {/* List */}
      <div className='space-y-4'>
        {isLoading && (
          <div className='rounded-xl border bg-white p-6 text-center text-zinc-500'>
            Loading…
          </div>
        )}

        {!isLoading &&
          items.map((it) => (
            <div key={it.id} className='rounded-xl border bg-white p-4'>
              {/* Header */}
              <div className='mb-3 flex items-center justify-between'>
                <div className='flex items-center gap-2 text-sm text-zinc-600'>
                  <StatusBadge status={it.status} />
                  <span>•</span>
                  <span className='font-medium'>
                    {it.invoice ?? `INV${it.id}`}
                  </span>
                  {it.createdAt && (
                    <>
                      <span>•</span>
                      <span>
                        {new Date(it.createdAt).toLocaleString('id-ID')}
                      </span>
                    </>
                  )}
                </div>
                <RowActions item={it} />
              </div>

              {/* Grid Detail */}
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                {/* Product */}
                <div className='md:col-span-2 flex items-center gap-3'>
                  <Image
                    src={it.productImage || '/placeholder.png'}
                    alt={it.productTitle || 'Product'}
                    width={64}
                    height={64}
                    className='rounded-md object-cover'
                  />
                  <div className='min-w-0'>
                    <div className='font-medium truncate'>
                      {it.productTitle || '-'}
                    </div>
                    <div className='text-xs text-zinc-500'>
                      {it.quantity ?? 0} × {formatRupiah(it.unitPrice)}
                    </div>
                  </div>
                </div>

                {/* Buyer */}
                <div className='text-sm'>
                  <div className='font-medium mb-1'>Buyer</div>
                  <div className='text-zinc-600'>
                    {it.buyerName || '-'}
                    {it.buyerPhone ? ` (${it.buyerPhone})` : ''}
                    <br />
                    {it.shippingAddress || '-'}
                  </div>
                </div>

                {/* Shipping */}
                <div className='text-sm'>
                  <div className='font-medium mb-1'>Shipping</div>
                  <div className='text-zinc-600'>
                    {it.shippingMethod ?? '-'}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className='mt-3 border-t pt-3 text-sm flex justify-between'>
                <div className='font-medium'>Total Payment</div>
                <div>{formatRupiah(it.totalPrice)}</div>
              </div>
            </div>
          ))}

        {!isLoading && items.length === 0 && (
          <div className='rounded-xl border bg-white p-10 text-center text-zinc-500'>
            No orders found.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className='mt-6 flex items-center justify-end gap-2'>
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
    </SellerShell>
  );
}
