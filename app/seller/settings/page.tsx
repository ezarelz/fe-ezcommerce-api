// app/seller/settings/page.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';

import SellerShell from '@/components/seller/SellerShell';
import {
  useShopProfile,
  useUpdateShopProfile,
} from '@/hooks/seller/useShopProfile';

// shadcn/ui
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

const DOMAIN_PREFIX = '';

export default function SellerSettingsPage() {
  const { data: shop, isLoading, isError } = useShopProfile();
  const update = useUpdateShopProfile();

  // local states for dialogs
  const [openProfile, setOpenProfile] = useState(false);
  const [openAddress, setOpenAddress] = useState(false);

  // profile form states
  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);

  // address form
  const [address, setAddress] = useState('');

  // hydrate when data ready
  const hydrateProfile = () => {
    if (!shop) return;
    setName(shop.name ?? '');
    setIsActive(!!shop.isActive);
    setLogoFile(null);
  };
  const hydrateAddress = () => {
    if (!shop) return;
    setAddress(shop.address ?? '');
  };

  const handleSaveProfile = () => {
    update.mutate(
      { name, isActive, logoFile },
      { onSuccess: () => setOpenProfile(false) }
    );
  };

  const handleSaveAddress = () => {
    update.mutate({ address }, { onSuccess: () => setOpenAddress(false) });
  };

  return (
    <SellerShell>
      <div className='px-2 sm:px-4 py-6'>
        <h1 className='mb-5 text-2xl font-semibold'>Settings</h1>

        {isLoading && (
          <div className='space-y-4'>
            <Skeleton className='h-10 w-40' />
            <Skeleton className='h-40 w-full' />
          </div>
        )}
        {isError && (
          <div className='text-red-600'>Failed to load shop profile.</div>
        )}

        {shop && (
          <Tabs defaultValue='profile' className='w-full'>
            <div className='rounded-xl border bg-white p-4 dark:bg-neutral-900'>
              <TabsList className='mb-4'>
                <TabsTrigger value='profile'>Profile</TabsTrigger>
                <TabsTrigger value='address'>Address</TabsTrigger>
              </TabsList>

              {/* PROFILE TAB */}
              <TabsContent value='profile' className='mt-0'>
                <div className='rounded-lg border p-4'>
                  <div className='flex items-start gap-4'>
                    <div className='relative h-16 w-16 overflow-hidden rounded-full border bg-gray-100'>
                      <Image
                        src={shop.logo || '/placeholder-avatar.png'}
                        alt='Shop Logo'
                        fill
                        className='object-cover'
                        sizes='64px'
                      />
                    </div>

                    <div className='flex-1'>
                      <div className='text-sm opacity-70'>Store Name</div>
                      <div className='mb-3 font-medium'>{shop.name}</div>

                      <div className='text-sm opacity-70'>
                        Store Domain / Desc
                      </div>
                      <div className='mb-3 text-sm'>
                        {DOMAIN_PREFIX}
                        <span className='font-mono'>{shop.slug}</span>
                      </div>

                      <Dialog
                        open={openProfile}
                        onOpenChange={(o) => {
                          setOpenProfile(o);
                          if (o) hydrateProfile();
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant='outline'>Change Profile</Button>
                        </DialogTrigger>
                        <DialogContent className='sm:max-w-md'>
                          <DialogHeader>
                            <DialogTitle>Change Profile</DialogTitle>
                          </DialogHeader>

                          {/* Logo */}
                          <div className='mx-auto mb-3 flex flex-col items-center'>
                            <div className='relative mb-2 h-20 w-20 overflow-hidden rounded-full border bg-gray-100'>
                              <Image
                                src={
                                  logoFile
                                    ? URL.createObjectURL(logoFile)
                                    : shop.logo || '/placeholder-avatar.png'
                                }
                                alt='Preview'
                                fill
                                className='object-cover'
                                sizes='80px'
                              />
                            </div>
                            <label className='inline-block'>
                              <input
                                type='file'
                                accept='image/png,image/jpeg,image/webp'
                                className='hidden'
                                onChange={(e) =>
                                  setLogoFile(
                                    e.currentTarget.files?.[0] ?? null
                                  )
                                }
                              />
                              <span className='cursor-pointer rounded-md border px-3 py-1 text-sm'>
                                Change Photo
                              </span>
                            </label>
                          </div>

                          {/* Name */}
                          <div className='space-y-1'>
                            <Label>Store Name</Label>
                            <Input
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder='Your shop name'
                            />
                          </div>

                          {/* Domain (read-only) */}
                          <div className='space-y-1'>
                            <Label>Store Domain</Label>
                            <Input
                              value={`${DOMAIN_PREFIX}${shop.slug}`}
                              readOnly
                            />
                          </div>

                          {/* Active toggle */}
                          <div className='flex items-center justify-between rounded-md border p-3'>
                            <div>
                              <div className='text-sm font-medium'>
                                Shop Active
                              </div>
                              <div className='text-xs opacity-70'>
                                Toggle shop visibility
                              </div>
                            </div>
                            <Switch
                              checked={isActive}
                              onCheckedChange={setIsActive}
                            />
                          </div>

                          <div className='flex items-center justify-end gap-2'>
                            <DialogClose asChild>
                              <Button variant='outline'>Cancel</Button>
                            </DialogClose>
                            <Button
                              onClick={handleSaveProfile}
                              disabled={update.isPending}
                            >
                              {update.isPending ? 'Saving…' : 'Save'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ADDRESS TAB */}
              <TabsContent value='address' className='mt-0'>
                <div className='rounded-lg border p-4'>
                  <div className='mb-3'>
                    <div className='font-medium'>
                      {shop.address ? 'Current Address' : 'No address set'}
                    </div>
                    {shop.address && (
                      <p className='mt-1 whitespace-pre-line text-sm opacity-80'>
                        {shop.address}
                      </p>
                    )}
                  </div>

                  <Dialog
                    open={openAddress}
                    onOpenChange={(o) => {
                      setOpenAddress(o);
                      if (o) hydrateAddress();
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant='outline'>Change Address</Button>
                    </DialogTrigger>
                    <DialogContent className='sm:max-w-md'>
                      <DialogHeader>
                        <DialogTitle>Change Address</DialogTitle>
                      </DialogHeader>

                      <div className='space-y-1'>
                        <Label>Address</Label>
                        <Textarea
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder='Street, District, City, Postal Code'
                          rows={4}
                        />
                        <p className='text-xs opacity-70'>
                          *Swagger menerima satu field <code>address</code>.
                          City/Postal bisa kamu masukkan di sini.
                        </p>
                      </div>

                      <div className='flex items-center justify-end gap-2'>
                        <DialogClose asChild>
                          <Button variant='outline'>Cancel</Button>
                        </DialogClose>
                        <Button
                          onClick={handleSaveAddress}
                          disabled={update.isPending}
                        >
                          {update.isPending ? 'Saving…' : 'Save'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </SellerShell>
  );
}
