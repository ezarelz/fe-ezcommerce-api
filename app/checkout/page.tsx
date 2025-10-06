// app/checkout/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { SubmitHandler, Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';

import Header from '@/components/container/Header';
import Footer from '@/components/container/Footer';
import { api } from '@/lib/api';

import {
  CheckoutFormSchema,
  CheckoutFormValues,
  PaymentCode,
  ShippingCode,
} from '@/validator/checkout';

/* Utils */
const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })
    .format(n)
    .replace('Rp', 'Rp');

/* ===== API shapes (strict, no any) ===== */
type ApiResp<T> = { success: boolean; message: string; data: T };

type ProductShop = {
  id: number;
  name: string;
  slug?: string;
  logo?: string | null;
};

type ProductDetail = {
  id: number;
  title?: string;
  name?: string;
  price: number;
  images?: string[];
  imageUrl?: string | null;
  image?: string | null;
  shop?: ProductShop; // <-- detail produk mengandung shop
};

type RawCartItem = {
  id: number;
  qty: number;
  product: {
    id: number;
    title?: string;
    name?: string;
    price: number;
    imageUrl?: string | null;
    image?: string | null;
    images?: string[] | null;
    // NOTE: pada /api/cart biasanya TIDAK ada shop
  };
};

type RawCart = {
  cartId?: number;
  items: RawCartItem[];
  grandTotal?: number;
};

type CartItem = {
  id: number;
  qty: number;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl?: string | null;
    shop?: ProductShop;
  };
};
/* ---------- Enrichment helpers ---------- */

// cache ringan supaya tidak refetch product yang sama berkali-kali
const shopCache = new Map<number, ProductShop | undefined>();

async function fetchProductShop(
  productId: number
): Promise<ProductShop | undefined> {
  if (shopCache.has(productId)) return shopCache.get(productId);

  const res = await api<ApiResp<ProductDetail>>(`/api/products/${productId}`, {
    method: 'GET',
    useAuth: true, // pakai auth sama
  });

  const shop = res.data?.shop;
  shopCache.set(productId, shop);
  return shop;
}

async function enrichCartWithShops(items: CartItem[]): Promise<CartItem[]> {
  // kumpulkan productId unik yang belum ada di cache
  const ids = Array.from(
    new Set(items.map((it) => it.product.id).filter((id) => !shopCache.has(id)))
  );

  if (ids.length > 0) {
    // fetch paralel (kalau error, biarkan undefined → nanti fallback)
    await Promise.all(
      ids.map((id) => fetchProductShop(id).catch(() => undefined))
    );
  }

  // isi shop ke tiap item dari cache
  return items.map((it) => {
    const filledShop = it.product.shop ?? shopCache.get(it.product.id);
    return filledShop
      ? { ...it, product: { ...it.product, shop: filledShop } }
      : it;
  });
}

/* ---------- GET /api/cart via api() helper (Axios) ---------- */
async function fetchCart(): Promise<CartItem[]> {
  const res = await api<ApiResp<RawCart>>('/api/cart', {
    method: 'GET',
    useAuth: true,
  });

  const items = res.data?.items ?? [];
  const normalized: CartItem[] = items.map((it) => {
    const p = it.product;
    const name = (p.title ?? p.name ?? 'Product').toString();
    const img =
      p.imageUrl ??
      p.image ??
      (Array.isArray(p.images) ? p.images[0] ?? null : null);

    return {
      id: it.id,
      qty: it.qty,
      product: {
        id: p.id,
        name,
        price: Number(p.price ?? 0),
        imageUrl: img ?? null,
        // shop akan diisi oleh enrichCartWithShops()
      },
    };
  });
  // isi field shop yang kosong dengan memanggil /api/products/{id}
  return enrichCartWithShops(normalized);
}

/* Checkout payload */
interface CheckoutRequest {
  address: {
    name: string;
    phone: string;
    city: string;
    postal: string;
    address: string;
  };
  shipping: ShippingCode;
  paymentMethod: PaymentCode;
}
interface CheckoutResponse {
  orderId: number;
  status: 'PAID' | 'PENDING';
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[] | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchCart()
      .then((c) => mounted && setCart(c))
      .catch(() => setCart([]));
    return () => {
      mounted = false;
    };
  }, []);

  // Penting: generic sama persis dengan schema agar resolver tidak error
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    watch,
    setValue,
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(CheckoutFormSchema) as Resolver<CheckoutFormValues>,
    mode: 'onChange',
    defaultValues: {
      name: '',
      phone: '',
      city: '',
      postal: '',
      address: '',
      payment: 'BNI',
    },
  });

  const shipping = watch('shipping');
  const payment = watch('payment');

  const shippingCost = useMemo(() => {
    if (shipping === 'JNT') return 10_000;
    if (shipping === 'JNE') return 18_000;
    return 0;
  }, [shipping]);

  const subtotal = useMemo(
    () => (cart ?? []).reduce((sum, c) => sum + c.qty * c.product.price, 0),
    [cart]
  );
  const grandTotal = subtotal + shippingCost;

  const onSubmit: SubmitHandler<CheckoutFormValues> = async (values) => {
    if (!values.shipping) return;

    const payload: CheckoutRequest = {
      address: {
        name: values.name,
        phone: values.phone,
        city: values.city,
        postal: values.postal,
        address: values.address,
      },
      shipping: values.shipping,
      paymentMethod: values.payment,
    };

    const res = await api<ApiResp<CheckoutResponse>>('/api/orders/checkout', {
      method: 'POST',
      data: payload,
      useAuth: true,
    });

    alert(
      `Order #${res.data.orderId} ${res.data.status}. Total: ${rp(grandTotal)}`
    );
  };

  const shopName =
    cart && cart.length > 0 ? cart[0].product.shop?.name ?? 'Toko' : '—';

  return (
    <>
      <Header />

      <main className='min-h-screen bg-zinc-50'>
        <div className='mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_360px] lg:py-10'>
          <h1 className='col-span-full text-2xl font-bold text-zinc-900'>
            Checkout
          </h1>

          {/* LEFT */}
          <section className='space-y-6'>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
              {/* Address */}
              <div className='rounded-2xl border border-zinc-200 bg-white p-4 md:p-5'>
                <div className='mb-3 text-sm font-semibold text-zinc-900'>
                  Shipping Address
                </div>

                <div className='space-y-3'>
                  <div>
                    <input
                      {...register('name')}
                      placeholder='Name'
                      className='w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-400'
                    />
                    {errors.name && (
                      <p className='mt-1 text-xs text-rose-500'>
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      {...register('phone')}
                      placeholder='Phone Number'
                      className='w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-400'
                    />
                    {errors.phone && (
                      <p className='mt-1 text-xs text-rose-500'>
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      {...register('city')}
                      placeholder='City'
                      className='w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-400'
                    />
                    {errors.city && (
                      <p className='mt-1 text-xs text-rose-500'>
                        {errors.city.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      {...register('postal')}
                      placeholder='Postal Code'
                      className='w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-400'
                    />
                    {errors.postal && (
                      <p className='mt-1 text-xs text-rose-500'>
                        {errors.postal.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <textarea
                      {...register('address')}
                      placeholder='Address'
                      rows={3}
                      className='w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-400'
                    />
                    {errors.address && (
                      <p className='mt-1 text-xs text-rose-500'>
                        {errors.address.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items per shop */}
              <div className='rounded-2xl border border-zinc-200 bg-white p-4 md:p-5'>
                <div className='mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900'>
                  <Image
                    src='/icons/store-ico.svg'
                    alt=''
                    width={18}
                    height={18}
                  />
                  {shopName}
                </div>

                {/* list produk */}
                <ul className='space-y-3'>
                  {(cart ?? []).map((ci) => (
                    <li
                      key={ci.id}
                      className='flex items-center justify-between gap-3 rounded-xl bg-zinc-50 p-3'
                    >
                      <div className='flex items-center gap-3'>
                        <div className='size-14 overflow-hidden rounded-lg bg-zinc-200'>
                          {ci.product.imageUrl ? (
                            <Image
                              src={ci.product.imageUrl}
                              alt={ci.product.name}
                              width={56}
                              height={56}
                              className='h-14 w-14 object-cover'
                            />
                          ) : null}
                        </div>
                        <div>
                          <div className='text-sm font-medium text-zinc-900'>
                            {ci.product.name}
                          </div>
                          <div className='text-xs text-zinc-500'>
                            Qty {ci.qty}
                          </div>
                        </div>
                      </div>
                      <div className='text-sm font-semibold text-zinc-900'>
                        {ci.qty} X {rp(ci.product.price)}
                      </div>
                    </li>
                  ))}
                </ul>

                {/* divider */}
                <div className='my-4 h-px w-full bg-zinc-200' />

                {/* Shipping Method - SELECT biasa */}
                <div className='mb-2 text-sm font-semibold text-zinc-900'>
                  Shipping Method
                </div>
                <div className='relative'>
                  <select
                    {...register('shipping')}
                    value={shipping ?? ''}
                    onChange={(e) =>
                      setValue(
                        'shipping',
                        (e.target.value || undefined) as
                          | ShippingCode
                          | undefined,
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      )
                    }
                    className='w-full appearance-none rounded-xl border border-zinc-300 bg-white px-3 py-2 pr-9 text-sm text-zinc-700 outline-none focus:border-zinc-400'
                  >
                    <option value='' disabled>
                      Select Shipping
                    </option>
                    <option value='JNT'>JNT EXPRESS - Rp10.000</option>
                    <option value='JNE'>JNE - Rp18.000</option>
                  </select>

                  {/* chevron */}
                  <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-70'>
                    <svg
                      width='15'
                      height='15'
                      viewBox='0 0 15 15'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path
                        d='M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z'
                        fill='currentColor'
                      />
                    </svg>
                  </span>
                </div>

                {errors.shipping && (
                  <p className='mt-2 text-xs text-rose-500'>
                    {errors.shipping.message}
                  </p>
                )}

                {/* Submit on mobile */}
                <div className='mt-5 flex items-center justify-end md:hidden'>
                  <button
                    type='submit'
                    disabled={!isValid || !shipping || isSubmitting}
                    className='rounded-xl bg-zinc-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50'
                  >
                    {isSubmitting ? 'Processing…' : 'Pay Now'}
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* RIGHT */}
          <aside className='h-max rounded-2xl border border-zinc-200 bg-white'>
            <div className='border-b border-zinc-200 p-4 md:p-5'>
              <div className='mb-3 text-sm font-semibold text-zinc-900'>
                Payment Method
              </div>

              <div className='space-y-3'>
                {(
                  [
                    {
                      code: 'BNI',
                      label: 'BNI Virtual Account',
                      logo: '/icons/banks_icon/bni.svg',
                    },
                    {
                      code: 'BRI',
                      label: 'BRI Virtual Account',
                      logo: '/icons/banks_icon/bri.svg',
                    },
                    {
                      code: 'BCA',
                      label: 'BCA Virtual Account',
                      logo: '/icons/banks_icon/bca.svg',
                    },
                    {
                      code: 'MANDIRI',
                      label: 'Mandiri Virtual Account',
                      logo: '/icons/banks_icon/mandiri.svg',
                    },
                  ] as const
                ).map((pm) => (
                  <label
                    key={pm.code}
                    className='flex cursor-pointer items-center justify-between rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm'
                  >
                    <span className='flex items-center gap-2'>
                      <Image
                        src={pm.logo}
                        alt={pm.code}
                        width={24}
                        height={24}
                      />
                      {pm.label}
                    </span>
                    <input
                      type='radio'
                      name='payment'
                      value={pm.code}
                      checked={payment === pm.code}
                      onChange={() =>
                        setValue('payment', pm.code as PaymentCode, {
                          shouldDirty: true,
                        })
                      }
                      className='size-4 accent-zinc-900'
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className='space-y-3 p-4 md:p-5'>
              <div className='text-sm font-semibold text-zinc-900'>
                Payment Summary
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-zinc-600'>Total Price of Goods</span>
                <span className='font-medium text-zinc-900'>
                  {rp(subtotal)}
                </span>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-zinc-600'>Shipping cost</span>
                <span className='font-medium text-zinc-900'>
                  {rp(shippingCost)}
                </span>
              </div>
              <div className='flex items-center justify-between border-t border-zinc-200 pt-2 text-base'>
                <span className='font-semibold text-zinc-900'>Total</span>
                <span className='font-semibold text-zinc-900'>
                  {rp(grandTotal)}
                </span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  (
                    document.querySelector('form') as HTMLFormElement | null
                  )?.requestSubmit();
                }}
              >
                <button
                  type='submit'
                  disabled={!isValid || !shipping}
                  className='mt-2 w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50'
                >
                  Pay Now
                </button>
              </form>

              <div className='text-xs text-zinc-500'>
                Please Complete Shipping Adress{' '}
                <span className='font-medium'>
                  ,then you could proceed Pay Now
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
