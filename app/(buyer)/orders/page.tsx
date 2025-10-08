/* eslint-disable @typescript-eslint/no-explicit-any */
// app/orders/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';

import Header from '@/components/container/Header';
import Footer from '@/components/container/Footer';
import { api } from '@/lib/api';

/* ========== Utils ========== */
const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })
    .format(n)
    .replace('Rp', 'Rp');

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/* ========== API Types ========== */
type ApiResp<T> = { success: boolean; message: string; data: T };

type Me = { id: number; name: string; avatarUrl?: string | null };

type OrderItemProduct = {
  id: number;
  title?: string;
  name?: string;
  images?: string[];
};
type OrderItemShop = { id: number; name: string; slug?: string };

type OrderItem = {
  id: number;
  productId: number;
  shopId?: number;
  qty: number;
  priceSnapshot: number;
  status:
    | 'NEW'
    | 'CONFIRMED'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'CANCELLED'
    | string;
  product: OrderItemProduct;
  shop?: OrderItemShop;
};

type Order = {
  id: number;
  code: string;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED' | string;
  address: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
};

type OrdersPayload = { orders: Order[] };

/* ========== Helpers ========== */
type TabKey = 'ALL' | 'PROCESSING' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';

function mapOrderToTab(o: Order): Exclude<TabKey, 'ALL'> {
  const items = o.items ?? [];
  const every = (s: string) =>
    items.length > 0 && items.every((it) => it.status === s);
  const some = (s: string) => items.some((it) => it.status === s);

  if (o.paymentStatus === 'FAILED' || some('CANCELLED')) return 'CANCELLED';
  if (every('COMPLETED')) return 'COMPLETED';
  if (every('DELIVERED')) return 'DELIVERED';
  return 'PROCESSING';
}

const productTitle = (p: OrderItemProduct) => p.title ?? p.name ?? 'Product';
const productImage = (p: OrderItemProduct) => p.images?.[0] || undefined;

/* ========== Fetchers ========== */
async function fetchMe(): Promise<Me | null> {
  try {
    const res = await api<ApiResp<Me>>('/api/me', {
      method: 'GET',
      useAuth: true,
    });
    return res.data ?? null;
  } catch {
    return null;
  }
}

async function fetchOrders(page = 1, limit = 10): Promise<Order[]> {
  const res = await api<ApiResp<OrdersPayload>>('/api/orders/my', {
    method: 'GET',
    params: { page, limit },
    useAuth: true,
  });
  return res.data.orders ?? [];
}

async function completeOrderItem(itemId: number): Promise<void> {
  await api<ApiResp<unknown>>(`/api/orders/items/${itemId}/complete`, {
    method: 'PATCH',
    useAuth: true,
  });
}

async function completeOrderItems(ids: number[]): Promise<void> {
  await Promise.all(
    ids.map((id) => completeOrderItem(id).catch(() => undefined))
  );
}

/* ========== Hook: request cancel order (order-level) ========== */
function useRequestCancelOrder() {
  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
    }: {
      orderId: number;
      reason?: string;
    }) => {
      // Swagger: PATCH /api/orders/{id}/cancel  body: { reason: "..." }
      return api<ApiResp<unknown>>(`/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        data: { reason: (reason ?? '').trim() }, // boleh kosong, tetap kirim field
        useAuth: true,
      });
    },
  });
}

/* ========== UI: Request Cancel (order-level) ========== */
function RequestCancelButton({
  orderId,
  disabled,
  onDone,
}: {
  orderId: number;
  disabled?: boolean;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const { mutate, isPending } = useRequestCancelOrder();

  return (
    <>
      <button
        disabled={disabled}
        onClick={() => setOpen(true)}
        className='rounded-lg border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-50 disabled:opacity-50'
      >
        Cancel Order
      </button>

      {open && (
        <div className='fixed inset-0 z-50 grid place-items-center bg-black/40'>
          <div className='w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg'>
            <div className='mb-2 text-sm font-semibold'>Cancel Order</div>
            <p className='mb-3 text-xs text-zinc-600'>
              Permintaan pembatalan akan dikirim ke seller. Item yang belum
              dikirim akan dibatalkan.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='Tulis alasan (opsional, contoh: Change of mind)'
              className='mb-3 w-full rounded-lg border px-3 py-2 text-sm outline-none'
              rows={3}
            />
            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setOpen(false)}
                className='rounded-lg px-3 py-1.5 text-sm'
              >
                Batal
              </button>
              <button
                onClick={() =>
                  mutate(
                    { orderId, reason },
                    {
                      onSuccess: () => {
                        setOpen(false);
                        onDone?.();
                      },
                      onError: (e: any) => {
                        alert(e?.message ?? 'Failed to send cancel request.');
                      },
                    }
                  )
                }
                disabled={isPending}
                className='rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50'
              >
                {isPending ? 'Sending…' : 'Kirim Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ========== Page ========== */
export default function OrdersPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [tab, setTab] = useState<TabKey>('ALL');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [busyItem, setBusyItem] = useState<number | null>(null);

  const refetchOrders = () =>
    fetchOrders(page, 10)
      .then(setOrders)
      .catch(() => setOrders([]));

  useEffect(() => {
    let mounted = true;
    fetchMe().then((u) => mounted && setMe(u));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    refetchOrders();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filtered = useMemo(() => {
    const base = (orders ?? []).filter((o) =>
      tab === 'ALL' ? true : mapOrderToTab(o) === tab
    );
    const qq = q.trim().toLowerCase();
    if (!qq) return base;
    return base.filter((o) => {
      const inCode = o.code.toLowerCase().includes(qq);
      const inItems = o.items.some((it) => {
        const t = productTitle(it.product).toLowerCase();
        const s = it.shop?.name?.toLowerCase() ?? '';
        return t.includes(qq) || s.includes(qq);
      });
      return inCode || inItems;
    });
  }, [orders, tab, q]);

  const empty = (orders && orders.length === 0) || (filtered.length === 0 && q);

  /* ===== Actions ===== */
  const handleComplete = async (itemId: number) => {
    if (!confirm('Mark this order item as completed?')) return;
    setBusyItem(itemId);
    try {
      // optimistic update
      setOrders((prev) =>
        prev
          ? prev.map((o) => ({
              ...o,
              items: o.items.map((it) =>
                it.id === itemId ? { ...it, status: 'COMPLETED' } : it
              ),
            }))
          : prev
      );
      await completeOrderItem(itemId);
    } catch {
      await refetchOrders();
      alert('Failed to complete order item.');
    } finally {
      setBusyItem(null);
    }
  };

  return (
    <>
      <Header />

      <main className='min-h-screen bg-zinc-50'>
        <div className='mx-auto max-w-6xl px-4 py-6 lg:py-8'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]'>
            {/* Sidebar */}
            <aside className='h-max rounded-2xl border border-zinc-200 bg-white p-4'>
              <div className='mb-4 flex items-center gap-3'>
                <div className='size-10 overflow-hidden rounded-full bg-zinc-200'>
                  <Image
                    src={me?.avatarUrl || '/avatar/default.jpg'}
                    alt='avatar'
                    width={40}
                    height={40}
                    className='h-10 w-10 object-cover'
                  />
                </div>
                <div>
                  <div className='text-sm font-semibold text-zinc-900'>
                    {me?.name ?? 'User'}
                  </div>
                </div>
              </div>

              <nav className='space-y-1 text-sm'>
                <div className='flex items-center justify-between rounded-xl bg-zinc-100 px-3 py-2 font-medium text-zinc-900'>
                  <span className='flex items-center gap-2'>
                    <Image src='/icons/doc.svg' alt='' width={16} height={16} />
                    Order List
                  </span>
                </div>
                <Link
                  href='/review'
                  className='flex items-center gap-2 rounded-xl px-3 py-2 text-zinc-600 hover:bg-zinc-50'
                >
                  <Image src='/icons/star.svg' alt='' width={16} height={16} />
                  Review
                </Link>
                <button className='flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-rose-600 hover:bg-rose-50'>
                  <Image
                    src='/icons/logout.svg'
                    alt=''
                    width={16}
                    height={16}
                  />
                  Logout
                </button>
              </nav>
            </aside>

            {/* Content */}
            <section>
              <h1 className='mb-4 text-2xl font-bold text-zinc-900'>
                Order List
              </h1>

              {/* search + tabs */}
              <div className='mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                <div className='relative w-full md:max-w-md'>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder='Search order / product / shop…'
                    className='w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 pl-9 text-sm outline-none focus:border-zinc-400'
                  />
                  <span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2'>
                    <Image
                      src='/icons/search-icon.svg'
                      alt=''
                      width={16}
                      height={16}
                    />
                  </span>
                </div>

                <div className='flex shrink-0 gap-2 overflow-x-auto'>
                  {(
                    [
                      'ALL',
                      'PROCESSING',
                      'DELIVERED',
                      'COMPLETED',
                      'CANCELLED',
                    ] as TabKey[]
                  ).map((k) => (
                    <button
                      key={k}
                      onClick={() => setTab(k)}
                      className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${
                        tab === k
                          ? 'bg-zinc-900 font-medium text-white'
                          : 'bg-white text-zinc-700 border border-zinc-300'
                      }`}
                    >
                      {k === 'ALL'
                        ? 'All Order'
                        : k.charAt(0) + k.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* list */}
              <div className='space-y-3'>
                {(filtered ?? []).map((o) => {
                  const tabLabel = mapOrderToTab(o);
                  const isProcessing = tabLabel === 'PROCESSING';
                  return (
                    <article
                      key={o.id}
                      className='rounded-2xl border border-zinc-200 bg-white p-4'
                    >
                      {/* header */}
                      <div className='mb-3 flex items-center justify-between text-xs'>
                        <div className='flex flex-wrap items-center gap-2 text-zinc-600'>
                          <span className='flex items-center gap-1'>
                            <Image
                              src='/icons/store-ico.svg'
                              alt=''
                              width={14}
                              height={14}
                            />
                            <span className='font-medium text-zinc-900'>
                              {o.items[0]?.shop?.name ?? 'Toko'}
                            </span>
                          </span>
                          <span className='text-zinc-400'>•</span>
                          <span className='font-mono'>{o.code}</span>
                          <span className='text-zinc-400'>•</span>
                          <span>{fmtDate(o.createdAt)}</span>
                        </div>

                        <div className='flex items-center gap-2'>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              tabLabel === 'PROCESSING'
                                ? 'bg-amber-100 text-amber-800'
                                : tabLabel === 'DELIVERED'
                                ? 'bg-sky-100 text-sky-800'
                                : tabLabel === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : tabLabel === 'CANCELLED'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            {tabLabel === 'PROCESSING'
                              ? 'Processing'
                              : tabLabel === 'DELIVERED'
                              ? 'Delivered'
                              : tabLabel === 'COMPLETED'
                              ? 'Completed'
                              : tabLabel === 'CANCELLED'
                              ? 'Cancelled'
                              : '—'}
                          </span>

                          {/* ORDER-LEVEL: complete semua item yang masih SHIPPED */}
                          {o.items.some((it) => it.status === 'SHIPPED') && (
                            <button
                              onClick={async () => {
                                const ids = o.items
                                  .filter((it) => it.status === 'SHIPPED')
                                  .map((it) => it.id);
                                if (!ids.length) return;
                                // optimistic: set jadi COMPLETED
                                setOrders((prev) =>
                                  prev
                                    ? prev.map((ord) =>
                                        ord.id === o.id
                                          ? {
                                              ...ord,
                                              items: ord.items.map((it) =>
                                                ids.includes(it.id)
                                                  ? {
                                                      ...it,
                                                      status: 'COMPLETED',
                                                    }
                                                  : it
                                              ),
                                            }
                                          : ord
                                      )
                                    : prev
                                );
                                try {
                                  await completeOrderItems(ids);
                                } catch {
                                  // rollback fetch
                                  await refetchOrders();
                                  alert('Failed to complete shipped items.');
                                }
                              }}
                              className='rounded-lg bg-zinc-900 px-3 py-1 text-xs text-white hover:opacity-90'
                            >
                              Complete All Shipped
                            </button>
                          )}

                          {/* ORDER-LEVEL cancel request */}
                          {isProcessing && (
                            <RequestCancelButton
                              orderId={o.id}
                              onDone={refetchOrders}
                            />
                          )}
                        </div>
                      </div>

                      {/* items */}
                      <ul className='space-y-3'>
                        {o.items.map((it) => (
                          <li
                            key={it.id}
                            className='flex items-center justify-between gap-3'
                          >
                            <div className='flex items-center gap-3'>
                              <div className='size-12 overflow-hidden rounded-lg bg-zinc-200'>
                                {productImage(it.product) ? (
                                  <Image
                                    src={productImage(it.product)!}
                                    alt={productTitle(it.product)}
                                    width={48}
                                    height={48}
                                    className='h-12 w-12 object-cover'
                                  />
                                ) : null}
                              </div>
                              <div>
                                <div className='text-sm font-medium text-zinc-900'>
                                  {productTitle(it.product)}
                                </div>
                                <div className='text-xs text-zinc-500'>
                                  {it.qty} × {rp(it.priceSnapshot)}
                                </div>
                              </div>
                            </div>

                            {/* actions per item */}
                            <div className='flex items-center gap-2'>
                              {mapOrderToTab(o) === 'DELIVERED' &&
                                it.status !== 'COMPLETED' && (
                                  <button
                                    onClick={() => handleComplete(it.id)}
                                    disabled={busyItem === it.id}
                                    className='rounded-lg bg-zinc-900 px-3 py-1 text-xs text-white hover:opacity-90 disabled:opacity-50'
                                  >
                                    {busyItem === it.id
                                      ? 'Saving…'
                                      : 'Complete Order'}
                                  </button>
                                )}
                              {mapOrderToTab(o) === 'COMPLETED' && (
                                <Link
                                  href={`/review?itemId=${it.id}`}
                                  className='rounded-lg border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-50'
                                >
                                  Give Review
                                </Link>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>

                      {/* total */}
                      <div className='mt-3 border-t border-zinc-200 pt-2 text-sm'>
                        <span className='text-zinc-600'>Total Payment</span>{' '}
                        <span className='font-semibold text-zinc-900'>
                          {rp(o.totalAmount)}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Empty state */}
              {empty && (
                <div className='mt-10 rounded-2xl border border-zinc-200 bg-white p-10 text-center'>
                  <div className='mx-auto mb-3 size-16 rounded-full bg-zinc-100' />
                  <div className='mb-1 text-sm font-semibold text-zinc-900'>
                    No Orders Yet
                  </div>
                  <div className='mb-4 text-xs text-zinc-500'>
                    Once you place an order, you can see all your purchases
                    right here.
                  </div>
                  <Link
                    href='/'
                    className='inline-block rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white'
                  >
                    Start Shopping
                  </Link>
                </div>
              )}

              {/* Pagination (simple) */}
              {orders && orders.length > 0 && (
                <div className='mt-6 flex items-center justify-end gap-2 text-sm'>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className='rounded-lg border border-zinc-300 px-3 py-1 hover:bg-zinc-50 disabled:opacity-50'
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <span className='px-2'>Page {page}</span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className='rounded-lg border border-zinc-300 px-3 py-1 hover:bg-zinc-50'
                  >
                    Next
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
