// components/seller/SellerSidebar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import LogoutConfirm from '@/components/container/account/LogoutConfirm';

const items = [
  {
    href: '/seller/dashboard',
    label: 'Dashboard',
    icon: '/icons/grid-dots.svg',
  },
  { href: '/seller/products', label: 'Products', icon: '/icons/box.svg' },
  { href: '/seller/orders', label: 'Order List', icon: '/icons/file.svg' },
  { href: '/seller/reviews', label: 'Reviews', icon: '/icons/star-rating.svg' },
  { href: '/seller/settings', label: 'Settings', icon: '/icons/settings.svg' },
];

export default function SellerSidebar({
  className = '',
}: {
  className?: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <aside
      className={`hidden md:flex md:w-64 flex-col border-r bg-white ${className}`}
      aria-label='Seller sidebar'
    >
      {/* ========== NAV SECTION ========== */}
      <nav className='flex-1 p-3'>
        <ul className='space-y-1'>
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition
                  ${
                    isActive(it.href)
                      ? 'bg-zinc-100 font-medium'
                      : 'hover:bg-zinc-50 text-zinc-700'
                  }`}
              >
                <Image src={it.icon} alt='' width={16} height={16} />
                <span>{it.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className='flex-1' />

      {/* ========== LOGOUT SECTION ========== */}
      <div className='px-4 py-3 border-t mb-30'>
        <LogoutConfirm redirectTo='/'>
          <button className='flex items-center gap-2 w-full rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition'>
            <Image
              src='/icons/logout.svg'
              alt=''
              width={16}
              height={16}
              className='opacity-80'
            />
            <span>Logout</span>
          </button>
        </LogoutConfirm>
      </div>
    </aside>
  );
}
