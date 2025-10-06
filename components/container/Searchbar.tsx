// components/search/SearchBar.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';

interface ApiShop {
  id: number;
  name: string;
  slug?: string;
}

interface ApiProduct {
  id: number;
  title: string;
  slug: string;
  price: number;
  images: string[];
  shop: ApiShop;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    products: ApiProduct[];
  };
}

interface ProductLite {
  id: number;
  name: string;
  thumbnailUrl: string | null;
  price: number;
  shopName: string | null;
}

async function fetchSearch(q: string): Promise<ProductLite[]> {
  if (!q.trim()) return [];

  const params = new URLSearchParams({
    q,
    sort: 'newest',
    order: 'desc',
    page: '1',
    limit: '10',
  });

  const url = `${
    process.env.NEXT_PUBLIC_API_URL
  }/api/products?${params.toString()}`;
  const res = await fetch(url, { credentials: 'omit' });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);

  const json: ApiResponse = await res.json();
  const products = json?.data?.products ?? [];

  return products.map(
    (p): ProductLite => ({
      id: p.id,
      name: p.title,
      thumbnailUrl: p.images?.[0] ?? null,
      price: p.price,
      shopName: p.shop?.name ?? null,
    })
  );
}

export default function SearchBar() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebounced(q), 350);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [q]);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['search-products', debounced],
    queryFn: () => fetchSearch(debounced),
    enabled: debounced.length > 1,
    staleTime: 30_000,
  });

  const show = useMemo(() => open && debounced.length > 1, [open, debounced]);
  const list = Array.isArray(data) ? data : [];

  return (
    <div className='relative w-full'>
      {/* Search field container */}
      <div className='flex h-10 w-full items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 transition focus-within:border-zinc-400 lg:h-11'>
        <Image
          src='/icons/search-icon.svg'
          alt='Search'
          width={18}
          height={18}
          className='opacity-70'
        />
        <input
          type='search'
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder='Search'
          className='w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-500'
        />
      </div>

      {/* Dropdown result */}
      {show && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className='absolute left-0 right-0 mt-2 w-full rounded-xl border bg-white shadow-[0_8px_20px_0_#00000014] z-50'
        >
          {isFetching && <div className='p-3 text-sm'>Searching…</div>}
          {isError && (
            <div className='p-3 text-sm text-red-600'>
              Failed to load results
            </div>
          )}
          {!isFetching && !isError && list.length === 0 && (
            <div className='p-3 text-sm text-zinc-500'>No results</div>
          )}

          <ul className='max-h-80 overflow-auto'>
            {list.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/products/${p.id}`}
                  className='flex items-center gap-3 px-3 py-2 hover:bg-zinc-50'
                  onClick={() => setOpen(false)}
                >
                  <div className='size-10 rounded bg-gray-200 shrink-0 overflow-hidden'>
                    {p.thumbnailUrl && (
                      <Image
                        src={p.thumbnailUrl}
                        alt={p.name}
                        width={40}
                        height={40}
                        className='h-full w-full object-cover'
                      />
                    )}
                  </div>
                  <div className='min-w-0'>
                    <div className='truncate text-sm font-medium'>{p.name}</div>
                    <div className='text-xs text-gray-500'>
                      {p.shopName ?? 'Unknown shop'} • Rp
                      {p.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <button
            className='w-full flex items-center justify-center border-t px-3 py-2 hover:bg-zinc-50'
            onClick={() => setOpen(false)}
            aria-label='Close'
          >
            <svg
              width='15'
              height='15'
              viewBox='0 0 15 15'
              fill='currentColor'
              xmlns='http://www.w3.org/2000/svg'
              className='text-zinc-600 opacity-80 hover:opacity-100 transition'
            >
              <path
                d='M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z'
                fill='#000000'
                fillRule='evenodd'
                clipRule='evenodd'
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
