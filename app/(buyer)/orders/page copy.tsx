'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';

import Header from '@/components/container/Header';
import Footer from '@/components/container/Footer';
import { api } from '@/lib/api';
import { useBuyerOrders, Order } from '@/hooks/buyer/useBuyerOrders';
import { CompleteButton } from '@/hooks/buyer/useCompleteOrderItem';
import LogoutConfirm from '@/components/container/account/LogoutConfirm';

/* ====================== Utils ====================== */
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

/* ====================== Types ====================== */
type ApiResp<T> = { success: boolean; message: string; data: T };
type Me = { id: number; name: string; avatarUrl?: string | null };

type TabKey = 'ALL' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

/* ====================== Tab Mapping ====================== */

function mapOrderToTab(o: Order): TabKey {
  if (o.status === 'CANCELLED') return 'CANCELLED';

  if (
    o.items.length &&
    o.items.every(
      (it) => it.status === 'COMPLETED' || it.status === 'DELIVERED'
    )
  )
    return 'COMPLETED';

  if (o.status === 'PAID' || o.items.some((it) => it.status === 'PENDING'))
    return 'PROCESSING';

  return 'ALL';
}

const productTitle = (p?: { title?: string; name?: string }) =>
  p?.title ?? p?.name ?? 'Product';

const productImage = (p?: { images?: string[] }) =>
  p?.images && p.images.length > 0 ? p.images[0] : '/placeholder.png';

/* ====================== Fetch Me ====================== */
async function fetchMe() {
  try {
    const res = await api<Me>('/api/auth/me', {
      method: 'GET',
      useAuth: true,
    });
    return res;
  } catch {
    return null;
  }
}

/* ====================== Cancel Hook ====================== */
function useRequestCancelOrder() {
  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
    }: {
      orderId: number;
      reason?: string;
    }) => {
      return api<ApiResp<unknown>>(`/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        data: { reason: (reason ?? '').trim() },
        useAuth: true,
      });
    },
  });
}

/* ====================== Cancel Modal ====================== */
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
              A cancellation request will be sent to the seller. Items that have
              not yet been shipped will be cancelled.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='Write Reason (optional)'
              className='mb-3 w-full rounded-lg border px-3 py-2 text-sm outline-none'
              rows={3}
            />
            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setOpen(false)}
                className='rounded-lg px-3 py-1.5 text-sm'
              >
                Disregard
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
                      onError: (err) => {
                        alert(
                          (err as Error)?.message ??
                            'Failed to send cancel request.'
                        );
                      },
                    }
                  )
                }
                disabled={isPending}
                className='rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50'
              >
                {isPending ? 'Sending…' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ====================== Page Component ====================== */
export default function OrdersPage() {
  const [me, setMe] = useState<Me | null>(null);
  const { orders, isLoading, refetch } = useBuyerOrders();
  const [tab, setTab] = useState<TabKey>('ALL');
  const [q, setQ] = useState('');

  useEffect(() => {
    fetchMe().then(setMe);
  }, []);

  const filtered = useMemo(() => {
    const base = orders.filter((o) =>
      tab === 'ALL' ? true : mapOrderToTab(o) === tab
    );
    const qq = q.trim().toLowerCase();
    if (!qq) return base;
    return base.filter((o) => {
      const orderCode = `ORD-${o.id.toString().padStart(4, '0')}`;
      const inCode = orderCode.toLowerCase().includes(qq);
      const inItems = o.items.some((it) =>
        productTitle(it.product).toLowerCase().includes(qq)
      );
      return inCode || inItems;
    });
  }, [orders, tab, q]);

  const empty = orders.length === 0 || filtered.length === 0;

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
                  href='/reviews'
                  className='flex items-center gap-2 rounded-xl px-3 py-2 text-zinc-600 hover:bg-zinc-50'
                >
                  <Image src='/icons/star.svg' alt='' width={16} height={16} />
                  Review
                </Link>
                <LogoutConfirm redirectTo='/'>
                  <button className='flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-rose-600 hover:bg-rose-50'>
                    <Image
                      src='/icons/logout.svg'
                      alt=''
                      width={16}
                      height={16}
                    />
                    Logout
                  </button>
                </LogoutConfirm>
              </nav>
            </aside>

            {/* Orders Section */}
            <section>
              <h1 className='mb-4 text-2xl font-bold text-zinc-900'>
                Order List
              </h1>

              {isLoading && (
                <div className='p-6 text-center text-sm text-zinc-500'>
                  Loading orders...
                </div>
              )}

              {!isLoading && (
                <>
                  {/* Search & Tabs */}
                  <div className='mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                    <div className='relative w-full md:max-w-md'>
                      <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder='Search order / product…'
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
                            ? 'All Orders'
                            : k.charAt(0) + k.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Orders List */}
                  <div className='space-y-3'>
                    {filtered.map((o) => (
                      <article
                        key={o.id}
                        className='rounded-2xl border border-zinc-200 bg-white p-4'
                      >
                        <div className='mb-3 flex items-center justify-between text-xs'>
                          <div className='flex flex-wrap items-center gap-2 text-zinc-600'>
                            <span className='font-mono'>
                              ORD-{o.id.toString().padStart(4, '0')}
                            </span>
                            <span className='text-zinc-400'>•</span>
                            <span>{fmtDate(o.createdAt)}</span>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              o.status === 'PAID'
                                ? 'bg-amber-100 text-amber-800'
                                : o.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : o.status === 'CANCELLED'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            {o.status}
                          </span>
                        </div>

                        <ul className='space-y-3'>
                          {o.items.map((it) => (
                            <li
                              key={it.id}
                              className='flex items-center justify-between gap-3'
                            >
                              <div className='flex items-center gap-3'>
                                <div className='size-12 overflow-hidden rounded-lg bg-zinc-200'>
                                  {productImage(it.product) && (
                                    <Image
                                      src={productImage(it.product)!}
                                      alt={productTitle(it.product)}
                                      width={48}
                                      height={48}
                                      className='h-12 w-12 object-cover'
                                    />
                                  )}
                                </div>
                                <div>
                                  <div className='text-sm font-medium text-zinc-900'>
                                    {productTitle(it.product)}
                                  </div>
                                  <div className='text-xs text-zinc-500'>
                                    {it.quantity} × {rp(it.price)}
                                  </div>
                                </div>
                              </div>
                              {it.status === 'DELIVERED' && (
                                <CompleteButton
                                  itemId={it.id}
                                  disabled={false}
                                  onDone={refetch}
                                />
                              )}
                            </li>
                          ))}
                        </ul>

                        <div className='mt-3 border-t border-zinc-200 pt-2 text-sm'>
                          <span className='text-zinc-600'>Total Payment</span>{' '}
                          <span className='font-semibold text-zinc-900'>
                            {rp(o.total)}
                          </span>
                        </div>

                        {o.status === 'PAID' && (
                          <div className='mt-2'>
                            <RequestCancelButton
                              orderId={o.id}
                              onDone={refetch}
                            />
                          </div>
                        )}
                      </article>
                    ))}
                  </div>

                  {empty && (
                    <div className='mt-10 rounded-2xl border border-zinc-200 bg-white p-10 text-center'>
                      <div className='mx-auto mb-3 size-16 rounded-full bg-zinc-100' />
                      <div className='mb-1 text-sm font-semibold text-zinc-900'>
                        No Orders Yet
                      </div>
                      <div className='mb-4 text-xs text-zinc-500'>
                        Once you place an order, you can see it here.
                      </div>
                      <Link
                        href='/'
                        className='inline-block rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white'
                      >
                        Start Shopping
                      </Link>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
