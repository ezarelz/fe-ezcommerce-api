'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMe } from '@/hooks/useSession';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LogoutConfirm from './account/LogoutConfirm';
import { useCartCount } from '@/hooks/useCart';

export default function Header() {
  const [open, setOpen] = useState(false);
  const cartCount = useCartCount(); // dari Hooks useCart.ts
  const { data: me } = useMe();
  // const logout = useLogout();

  const initials =
    me?.name
      ?.split(' ')
      .map((s) => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'U';

  return (
    <header className='sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur'>
      <div className='mx-auto flex h-16 items-center gap-4 px-4 shadow-[0_0_20px_0_#CBCACA40] lg:h-[84px] lg:gap-6 lg:px-[120px]'>
        {/* Logo */}
        <Link href='/' className='flex items-center gap-2'>
          <Image
            src='/icons/logo-mobile.svg'
            alt='Logo'
            width={42}
            height={42}
          />
          <span className='hidden text-lg font-bold text-zinc-950 lg:inline'>
            Shirt
          </span>
        </Link>

        {/* Catalog + Search */}
        <div className='flex w-full items-center gap-2 lg:gap-3'>
          <Link
            href='/products'
            className='flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 px-2.5 md:w-[108px] lg:h-11 lg:gap-1.5 lg:px-4'
          >
            <Image
              src='/icons/catalog-icon.svg'
              width={20}
              height={20}
              alt='Catalog'
            />
            <span className='hidden text-sm md:inline'>Catalog</span>
          </Link>

          <div className='relative flex h-10 flex-1 items-center gap-1 rounded-xl border border-zinc-300 px-4 py-2 lg:h-11'>
            <Image
              src='/icons/search-icon.svg'
              width={20}
              height={20}
              alt='Search'
            />
            <input
              type='search'
              placeholder='Search'
              className='w-full text-sm text-zinc-700 outline-none placeholder:text-zinc-500'
            />
          </div>
        </div>

        {/* Cart + Auth */}
        <div className='flex items-center gap-3 lg:gap-4'>
          <Link
            href='/cart'
            className='relative inline-flex h-6 w-6 items-center justify-center rounded-lg hover:bg-zinc-100'
            title='Cart'
          >
            <Image
              src='/icons/cart-icon.svg'
              alt='Cart'
              width={24}
              height={24}
            />
            {!!cartCount && (
              <span className='absolute -right-2.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#EE1D52] text-[10px] font-semibold text-white'>
                {cartCount}
              </span>
            )}
          </Link>

          {/* ===== BEFORE LOGIN ===== */}
          {!me && (
            <div className='hidden items-center gap-2 lg:flex'>
              <Link href='/login'>
                <Button variant='brand'>Login</Button>
              </Link>
              <Link href='/register'>
                <Button variant='brand'>Register</Button>
              </Link>
            </div>
          )}

          {/* ===== AFTER LOGIN ===== */}
          {me && (
            <div className='hidden items-center gap-2 lg:flex'>
              {/* Buyer → Open Store, Seller → Seller Dashboard */}
              {me.role !== 'seller' ? (
                <Link href='/seller/activate'>
                  <Button variant='outline' className='rounded-2xl'>
                    <Image
                      src='/icons/store-ico.svg'
                      alt=''
                      width={18}
                      height={18}
                      className='mr-2'
                    />
                    Open Store
                  </Button>
                </Link>
              ) : (
                <Link href='/seller/dashboard'>
                  <Button variant='outline' className='rounded-2xl'>
                    <Image
                      src='/icons/store-ico.svg'
                      alt=''
                      width={18}
                      height={18}
                      className='mr-2'
                    />
                    Seller Dashboard
                  </Button>
                </Link>
              )}

              {/* Avatar + Name + Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className='inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-2.5 py-1.5 hover:bg-zinc-50'
                    aria-label='Account menu'
                  >
                    <Avatar className='h-7 w-7'>
                      <AvatarImage src={me.avatarUrl} alt={me.name} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className='text-sm font-medium'>{me.name}</span>
                    <Image
                      src='/icons/chevron-down.svg'
                      width={16}
                      height={16}
                      alt=''
                      className='opacity-70'
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='end'
                  className='w-48 cursor-pointer'
                >
                  <DropdownMenuLabel className='truncate'>
                    {me.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className='cursor-pointer'>
                    <Link href='/buyer'>Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className='cursor-pointer'>
                    <Link href='/orders'>My Orders</Link>
                  </DropdownMenuItem>
                  {me.role !== 'seller' ? (
                    <DropdownMenuItem asChild className='cursor-pointer'>
                      <Link href='/seller/activate'>Open Store</Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild className='cursor-pointer'>
                      <Link href='/seller/dashboard'>Seller Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <LogoutConfirm redirectTo='/'>
                      <Button
                        variant='destructive'
                        className='w-full justify-center'
                      >
                        Logout
                      </Button>
                    </LogoutConfirm>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            className='inline-flex items-center justify-center rounded-lg p-2 hover:bg-zinc-100 lg:hidden'
            onClick={() => setOpen((s) => !s)}
            aria-label='Open menu'
          >
            <Image
              src='/icons/hamburger-ico-button.svg'
              width={24}
              height={24}
              alt='menu'
            />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className='border-t border-zinc-200 bg-white px-4 py-3 lg:hidden'>
          <div className='flex flex-col gap-2'>
            {!me ? (
              <>
                <Link href='/login' className='py-2'>
                  Login
                </Link>
                <Link href='/register' className='py-2'>
                  Register
                </Link>
              </>
            ) : (
              <>
                <div className='flex items-center gap-2 py-2'>
                  <Avatar className='h-7 w-7'>
                    <AvatarImage src={me.avatarUrl} alt={me.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className='text-sm font-medium'>{me.name}</div>
                </div>
                <Link href='/buyer' className='py-2'>
                  Profile
                </Link>
                <Link href='/orders' className='py-2'>
                  My Orders
                </Link>
                {me.role !== 'seller' ? (
                  <Link href='/seller/activate' className='py-2'>
                    Open Store
                  </Link>
                ) : (
                  <Link href='/seller/dashboard' className='py-2'>
                    Seller Dashboard
                  </Link>
                )}
                <LogoutConfirm redirectTo='/'>
                  <button className='cursor-pointer py-2 text-left text-red-600'>
                    Logout
                  </button>
                </LogoutConfirm>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
