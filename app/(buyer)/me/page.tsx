// app/me/page.tsx
'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { string, z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import Header from '@/components/container/Header';
import Footer from '@/components/container/Footer';
import { useMe, useUpdateMe } from '@/hooks/useSession';

const ProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Max 80 chars'),
  phone: z.string().trim().max(30, 'Max 30 chars').optional().or(z.literal('')),
  avatarUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof ProfileSchema>;

export default function MePage() {
  const { data: me, isLoading, isError } = useMe();
  const update = useUpdateMe();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { name: '', phone: '', avatarUrl: '' },
  });

  // isi form dengan data GET /api/me
  useEffect(() => {
    if (me) {
      reset({
        name: me.name ?? '',
        phone: undefined,
        avatarUrl: me.avatarUrl ?? '',
      });
    }
  }, [me, reset]);

  const onSubmit = (values: ProfileForm) => {
    const body = {
      name: values.name?.trim(),
      phone: values.phone?.trim() || undefined,
      avatarUrl: values.avatarUrl?.trim() || undefined,
    };
    update.mutate(body);
  };

  const preview = watch('avatarUrl');

  return (
    <>
      <Header />
      <main className='container mx-auto max-w-2xl px-4 py-8'>
        <h1 className='text-2xl font-semibold mb-6'>My Profile</h1>

        {isLoading && (
          <div className='text-sm opacity-70'>Loading profile…</div>
        )}
        {isError && (
          <div className='text-sm text-red-600'>Failed to load profile.</div>
        )}

        {me && (
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* Avatar preview */}
            <div className='flex items-start gap-4'>
              <div className='relative h-20 w-20 overflow-hidden rounded-full border bg-gray-100'>
                <Image
                  src={preview || me.avatarUrl || '/placeholder-avatar.png'}
                  alt='Avatar'
                  fill
                  className='object-cover'
                  sizes='80px'
                />
              </div>
              <div className='flex-1'>
                <label className='block text-sm font-medium mb-1'>
                  Avatar URL
                </label>
                <input
                  type='url'
                  placeholder='https://res.cloudinary.com/…/avatar.jpg'
                  className='w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring'
                  {...register('avatarUrl')}
                />
                {errors.avatarUrl && (
                  <p className='mt-1 text-xs text-red-600'>
                    {errors.avatarUrl.message}
                  </p>
                )}
                <p className='mt-1 text-xs opacity-70'>
                  Enter Image URL (Cloudinary, PNG, WEBP Only). Preview on the
                  Left Side.
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className='block text-sm font-medium mb-1'>Name</label>
              <input
                type='text'
                className='w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring'
                placeholder='Your name'
                {...register('name')}
              />
              {errors.name && (
                <p className='mt-1 text-xs text-red-600'>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className='block text-sm font-medium mb-1'>Phone</label>
              <input
                type='text'
                className='w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring'
                placeholder='+62…'
                {...register('phone')}
              />
              {errors.phone && (
                <p className='mt-1 text-xs text-red-600'>
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className='block text-sm font-medium mb-1'>Email</label>
              <input
                value={me.email}
                readOnly
                className='w-full rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-600'
              />
              <p className='mt-1 text-xs opacity-70'>
                Email cannot be changed from Here.
              </p>
            </div>

            {/* Actions */}
            <div className='flex items-center gap-3'>
              <button
                type='submit'
                disabled={update.isPending || !isDirty}
                className='rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-60'
                title='Save changes'
              >
                {update.isPending ? 'Saving…' : 'Save'}
              </button>

              <button
                type='button'
                onClick={() =>
                  reset({
                    name: me.name ?? '',
                    phone: '',
                    avatarUrl: me.avatarUrl ?? '',
                  })
                }
                className='rounded-md px-3 py-2 text-sm'
              >
                Reset
              </button>

              {update.isSuccess && (
                <span className='text-sm text-green-700'>Profile updated.</span>
              )}
              {update.isError && (
                <span className='text-sm text-red-600'>
                  Update failed. Try again.
                </span>
              )}
            </div>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}
