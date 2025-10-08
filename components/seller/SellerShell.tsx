// components/seller/SellerShell.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import SellerHeader from '@/components/seller/SellerHeader';
import SellerSidebar from '@/components/seller/SellerSidebar';
import { usePathname } from 'next/navigation';

/* ===== Mobile-only sidebar content ===== */
function MobileSidebarContent({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const items = [
    {
      href: '/seller/dashboard',
      label: 'Dashboard',
      icon: '/icons/grid-dots.svg',
    },
    { href: '/seller/products', label: 'Products', icon: '/icons/box.svg' },
    { href: '/seller/orders', label: 'Order List', icon: '/icons/file.svg' },
    {
      href: '/seller/reviews',
      label: 'Reviews',
      icon: '/icons/star-rating.svg',
    },
    {
      href: '/seller/settings',
      label: 'Settings',
      icon: '/icons/settings.svg',
    },
  ];
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <div className='flex h-full flex-col'>
      <nav className='flex-1 p-3'>
        <ul className='space-y-1'>
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                onClick={onClose}
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

      <div className='p-3 border-t'>
        <Link
          href='/'
          onClick={onClose}
          className='block rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50'
        >
          Logout
        </Link>
      </div>
    </div>
  );
}

export default function SellerShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className='min-h-dvh flex flex-col bg-white'>
      {/* Header full width */}
      <SellerHeader onOpenMenu={() => setOpen(true)} title={title} />

      {/* Body: sidebar + content */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar desktop only */}
        <SellerSidebar className='hidden md:flex md:w-64' />

        {/* Main content (scrollable) */}
        <main className='flex-1 overflow-y-auto p-4 md:p-6 bg-zinc-50'>
          {children}
        </main>
      </div>

      {/* ===== Mobile Drawer (opened from header hamburger) ===== */}
      <div
        className={`md:hidden fixed inset-0 z-50 ${
          open ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setOpen(false)}
        />

        {/* Slide-in panel */}
        <aside
          className={`absolute left-0 top-0 h-full w-72 bg-white border-r shadow-xl transition-transform
            ${open ? 'translate-x-0' : '-translate-x-full'}`}
          role='dialog'
          aria-modal='true'
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button (bukan hamburger) */}
          <button
            onClick={() => setOpen(false)}
            className='absolute right-2 top-2 rounded-md p-2 hover:bg-zinc-100'
            aria-label='Close sidebar'
          >
            <Image src='/icons/close.svg' alt='' width={18} height={18} />
          </button>

          <MobileSidebarContent onClose={() => setOpen(false)} />
        </aside>
      </div>
    </div>
  );
}
