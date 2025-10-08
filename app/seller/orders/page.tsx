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

const rp = (n?: number | null) => `Rp${(n ?? 0).toLocaleString('id-ID')}`;

const TABS: Array<{
  key: 'ALL' | SellerOrderStatus | 'COMPLETED';
  label: string;
}> = [
  { key: 'ALL', label: 'All Order' },
  { key: 'NEW', label: 'New' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

function StatusBadge({ s }: { s: OrderItem['status'] | 'COMPLETED' }) {
  const map: Record<string, string> = {
    NEW: 'bg-zinc-100 text-zinc-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    SHIPPED: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-rose-100 text-rose-700',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${
        map[s] || ''
      }`}
    >
      {s}
    </span>
  );
}

function RowActions({ item }: { item: OrderItem }) {
  const { mutate, isPending } = useUpdateOrderItemStatus();
  const update = (status: 'CONFIRMED' | 'SHIPPED' | 'CANCELLED') =>
    mutate({ id: item.id, status });

  return (
    <div className='flex gap-2'>
      {item.status === 'NEW' && (
        <>
          {/* Reject */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant='outline' size='sm' disabled={isPending}>
                Reject Order
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
                  onClick={() => update('CANCELLED')}
                  disabled={isPending}
                >
                  Reject Order
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Accept */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size='sm'
                className='bg-black text-white hover:bg-black/90'
                disabled={isPending}
              >
                Accept Order
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Accept this order?</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => update('CONFIRMED')}
                  disabled={isPending}
                >
                  Accept
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {item.status === 'CONFIRMED' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant='destructive' size='sm' disabled={isPending}>
              Set Delivered
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Set as Delivered?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => update('SHIPPED')}
                disabled={isPending}
              >
                Set as Delivered
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('ALL');
  const [q, setQ] = useState('');
  const pageSize = 10;

  const statusParam = tab === 'ALL' || tab === 'COMPLETED' ? undefined : tab;
  const { data, isLoading } = useSellerOrderItems({
    page,
    limit: pageSize,
    status: statusParam,
  });

  // FE search + completed filter
  const items = useMemo(() => {
    let list = data?.items ?? [];
    if (tab === 'COMPLETED')
      list = list.filter((it) => it.status === 'COMPLETED');
    if (q.trim()) {
      const k = q.trim().toLowerCase();
      list = list.filter(
        (it) =>
          (it.productTitle || '').toLowerCase().includes(k) ||
          (it.buyerName || '').toLowerCase().includes(k) ||
          (it.invoice || '').toLowerCase().includes(k)
      );
    }
    return list;
  }, [data?.items, q, tab]);

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

  return (
    <SellerShell title='Order List'>
      {/* Filters row */}
      <div className='mb-4 flex items-center justify-between gap-3'>
        <div className='flex gap-2 overflow-x-auto'>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 text-sm ${
                tab === t.key
                  ? 'bg-black text-white'
                  : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-2 00'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className='w-64'>
          <Input
            placeholder='Search'
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
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
              <div className='mb-3 flex items-center justify-between'>
                <div className='flex items-center gap-2 text-sm text-zinc-600'>
                  <StatusBadge s={it.status} />
                  <span>•</span>
                  <span className='font-medium'>
                    {it.invoice ?? `INV${it.id}`}
                  </span>
                  {it.createdAt && (
                    <>
                      <span>•</span>
                      <span>{new Date(it.createdAt).toLocaleString()}</span>
                    </>
                  )}
                </div>
                <RowActions item={it} />
              </div>

              {/* Row grid */}
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
                      {it.quantity ?? 0} × {rp(it.unitPrice)}
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className='text-sm'>
                  <div className='font-medium mb-1'>Address</div>
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

              <div className='mt-3 border-t pt-3 text-sm'>
                <div className='font-medium'>Total Payment</div>
                <div>{rp(it.totalPrice)}</div>
              </div>
            </div>
          ))}

        {!isLoading && items.length === 0 && (
          <div className='rounded-xl border bg-white p-10 text-center text-zinc-500'>
            No orders.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className='mt-4 flex items-center justify-end gap-2'>
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
