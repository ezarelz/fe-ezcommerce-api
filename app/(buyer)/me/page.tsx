'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import Header from '@/components/container/Header';
import Footer from '@/components/container/Footer';
import { useMe, useUpdateMe } from '@/hooks/useSession';

const ProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Max 80 chars'),
  phone: z.string().trim().max(30, 'Max 30 chars').optional().or(z.literal('')),
  avatar: z.any().optional(),
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
    defaultValues: { name: '', phone: '' },
  });

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  /** 🧭 Saat data user (me) sudah di-load */
  useEffect(() => {
    if (me) {
      reset({
        name: me.name ?? '',
        phone: me.phone ?? '',
      });
      setPreview(me.avatarUrl ?? null);
    }
  }, [me, reset]);

  /** 🧾 Handle form submit */
  const onSubmit = async (values: ProfileForm) => {
    try {
      const formData = new FormData();
      formData.append('name', values.name.trim());
      if (values.phone) formData.append('phone', values.phone.trim());
      if (values.avatar?.[0]) formData.append('avatar', values.avatar[0]);

      await update.mutateAsync(formData);
      setPreview(
        values.avatar?.[0]
          ? URL.createObjectURL(values.avatar[0])
          : me?.avatarUrl ?? null
      );
    } catch (error) {
      console.error('❌ Update failed:', error);
    }
  };

  const selectedFile = watch('avatar')?.[0];

  return (
    <>
      <Header />
      <main className='container mx-auto max-w-2xl px-4 py-8'>
        <h1 className='text-2xl font-semibold mb-6'>My Profile</h1>

        {isLoading && <p className='text-sm opacity-70'>Loading profile…</p>}
        {isError && (
          <p className='text-sm text-red-600'>Failed to load profile.</p>
        )}

        {me && (
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* Avatar Upload */}
            <div className='flex items-start gap-4'>
              <div className='relative h-20 w-20 overflow-hidden rounded-full border bg-gray-100'>
                <Image
                  src={
                    selectedFile
                      ? URL.createObjectURL(selectedFile)
                      : preview || '/placeholder-avatar.png'
                  }
                  alt='Avatar'
                  fill
                  className='object-cover'
                  sizes='80px'
                />
              </div>

              <div className='flex-1'>
                <label className='block text-sm font-medium mb-1'>
                  Upload Avatar
                </label>
                <input
                  type='file'
                  accept='image/*'
                  className='block w-full text-sm file:mr-3 file:rounded-md file:border file:px-3 file:py-1 file:text-sm file:font-medium file:bg-gray-100 hover:file:bg-gray-200'
                  {...register('avatar')}
                  ref={(e) => {
                    register('avatar').ref(e);
                    fileRef.current = e;
                  }}
                />
                {errors.avatar && (
                  <p className='mt-1 text-xs text-red-600'>
                    {errors.avatar.message as string}
                  </p>
                )}
                <p className='mt-1 text-xs opacity-70'>
                  JPG, PNG, WEBP only. Max 5MB.
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
                Email cannot be changed here.
              </p>
            </div>

            {/* Actions */}
            <div className='flex items-center gap-3'>
              <button
                type='submit'
                disabled={update.isPending || !isDirty}
                className='rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-60'
              >
                {update.isPending ? 'Saving…' : 'Save'}
              </button>

              <button
                type='button'
                onClick={() => {
                  reset({
                    name: me.name ?? '',
                    phone: me.phone ?? '',
                  });
                  setPreview(me.avatarUrl ?? null);
                  if (fileRef.current) fileRef.current.value = '';
                }}
                className='rounded-md px-3 py-2 text-sm'
              >
                Reset
              </button>

              {update.isSuccess && (
                <span className='text-sm text-green-700'>
                  ✅ Profile updated successfully
                </span>
              )}
              {update.isError && (
                <span className='text-sm text-red-600'>
                  ❌ Update failed. Try again.
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
