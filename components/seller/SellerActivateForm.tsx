/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { apiClient } from '@/lib/api';
import {
  sellerActivateSchema,
  SellerActivateFormData,
} from '@/validator/sellerSchema';
import { UploadCloud } from 'lucide-react';
import NewSellerStatusModal from './NewSellerStatusModal';

export default function SellerActivateForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'success' | 'failed' | null>(null);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SellerActivateFormData>({
    resolver: zodResolver(sellerActivateSchema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const onSubmit = async (data: SellerActivateFormData) => {
    setLoading(true);
    setStatus(null);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('slug', data.slug || '');
      formData.append('address', data.address);
      if (data.logo instanceof File) {
        formData.append('logo', data.logo);
      }

      const res = await apiClient.post('/api/seller/activate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Simpan token dan update user
      localStorage.setItem('token', res.data.token);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...user, isSeller: true }));

      setStatus('success');
    } catch (error: any) {
      setStatus('failed');
      setMessage(
        error.response?.data?.message ||
          'Failed to create shop. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
        <div>
          <label className='block text-sm font-medium mb-1'>Store Name</label>
          <input
            {...register('name')}
            type='text'
            placeholder='Your Shop Name'
            className='w-full border rounded-lg p-2'
          />
          {errors.name && (
            <p className='text-red-500 text-sm mt-1'>{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>
            Store Slug (optional)
          </label>
          <input
            {...register('slug')}
            type='text'
            placeholder='Your Shop Description'
            className='w-full border rounded-lg p-2'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>Address</label>
          <input
            {...register('address')}
            type='text'
            placeholder='Your Address'
            className='w-full border rounded-lg p-2'
          />
          {errors.address && (
            <p className='text-red-500 text-sm mt-1'>
              {errors.address.message}
            </p>
          )}
        </div>

        {/* ✅ Polished upload section */}
        <div>
          <label className='block text-sm font-medium mb-1'>
            Logo (optional)
          </label>

          <div className='flex items-center gap-3'>
            <label
              htmlFor='logo-upload'
              className='inline-flex items-center justify-center rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors'
            >
              <UploadCloud
                size={16}
                className='mr-2 text-gray-600 dark:text-gray-300'
              />
              Choose File
            </label>

            <span className='text-sm text-gray-500 truncate max-w-[180px]'>
              {selectedFile ? selectedFile.name : 'No file selected'}
            </span>
          </div>

          <input
            id='logo-upload'
            {...register('logo')}
            type='file'
            accept='image/*'
            onChange={handleFileChange}
            className='hidden'
          />
        </div>

        <button
          type='submit'
          disabled={loading}
          className='w-full bg-black text-white py-2 rounded-lg hover:bg-neutral-800 disabled:bg-gray-400'
        >
          {loading ? 'Creating...' : 'Create Store'}
        </button>
      </form>

      {status && (
        <NewSellerStatusModal
          onClose={() => {
            setStatus(null);
            setMessage('');
          }}
          status={status}
          message={message}
        />
      )}
    </>
  );
}
