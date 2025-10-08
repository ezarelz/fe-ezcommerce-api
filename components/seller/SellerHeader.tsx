'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMe } from '@/hooks/useSession';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useSellerShop } from '@/hooks/useSellerShop';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import LogoutConfirm from '@/components/container/account/LogoutConfirm';

export default function SellerHeader({
  onOpenMenu,
  title,
}: {
  onOpenMenu?: () => void; // ✅ perbaikan disini
  title?: string;
}) {
  const { data: me } = useMe();
  const { data: shop } = useSellerShop();

  const initials = (me?.name ?? 'U')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className='sticky top-0 z-40 border-b bg-white'>
      <div className='mx-auto flex h-14 items-center justify-between px-4 md:px-6'>
        <div className='flex items-center gap-3'>
          <Link href='/' className='hidden md:flex items-center gap-2'>
            <Image
              src='/icons/logo-mobile.svg'
              alt='logo'
              width={24}
              height={24}
            />
            <div className='text-sm font-semibold leading-tight'>
              Shirt
              <br />
              Seller
            </div>
          </Link>

          {/* tombol hamburger - hanya panggil onOpenMenu */}
          <button
            onClick={onOpenMenu}
            className='md:hidden rounded-lg p-2 hover:bg-zinc-100'
            aria-label='Open sidebar'
          >
            <Image
              src='/icons/hamburger-ico-button.svg'
              alt=''
              width={20}
              height={20}
            />
          </button>

          {title && (
            <div className='md:ml-2 text-sm font-semibold'>{title}</div>
          )}
        </div>

        {/* Dropdown user */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className='inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-2.5 py-1.5 hover:bg-zinc-50'>
              <Avatar className='h-7 w-7'>
                <AvatarImage src={me?.avatarUrl ?? undefined} alt={me?.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className='hidden sm:inline text-sm font-medium truncate max-w-[140px]'>
                {me?.name ?? 'User'}
              </span>
              <Image
                src='/icons/chevron-down.svg'
                alt=''
                width={16}
                height={16}
                className='opacity-70'
              />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align='end' className='w-56'>
            <div className='flex flex-col px-3 pt-2 pb-1'>
              <span className='font-medium truncate text-sm'>
                {me?.name ?? 'User'}
              </span>
              <div className='flex items-center gap-1 text-xs text-neutral-600 truncate'>
                <Image
                  src='/icons/store-ico.svg'
                  alt=''
                  width={12}
                  height={12}
                  className='opacity-80'
                />
                {shop?.name ?? 'My Shop'}
              </div>
            </div>

            <DropdownMenuSeparator />

            <div className='px-2 pb-2'>
              <Button
                asChild
                variant='outline'
                className='w-full justify-center font-medium'
              >
                <Link href='/products'>Back to Buyer Account</Link>
              </Button>
            </div>

            <div className='px-2 pt-2 pb-3'>
              <LogoutConfirm redirectTo='/'>
                <button className='flex items-center gap-2 w-full rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50'>
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
