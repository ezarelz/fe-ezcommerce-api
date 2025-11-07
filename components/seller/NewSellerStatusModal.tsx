'use client';

import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';

interface NewSellerStatusModalProps {
  onClose: () => void;
  status: 'success' | 'failed';
  message?: string;
}

export default function NewSellerStatusModal({
  onClose,
  status,
  message,
}: NewSellerStatusModalProps) {
  const isSuccess = status === 'success';

  return (
    <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
      <div className='bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg w-80 text-center space-y-3 animate-fadeIn'>
        {isSuccess ? (
          <CheckCircle2 className='mx-auto text-green-500' size={48} />
        ) : (
          <XCircle className='mx-auto text-red-500' size={48} />
        )}

        <h2
          className={`text-lg font-semibold ${
            isSuccess ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {isSuccess ? 'Store Created Successfully!' : 'Failed to Create Store'}
        </h2>

        <p className='text-sm text-gray-500'>
          {message ||
            (isSuccess
              ? 'Your store is now active and ready to use.'
              : 'Something went wrong while creating your store.')}
        </p>

        <div className='flex flex-col gap-3 mt-4'>
          {isSuccess ? (
            <Link
              href='/seller/dashboard'
              className='bg-black text-white rounded-lg py-2 hover:bg-neutral-800'
            >
              Go to Seller Dashboard
            </Link>
          ) : (
            <button
              onClick={onClose}
              className='bg-red-500 text-white rounded-lg py-2 hover:bg-red-600'
            >
              Try Again
            </button>
          )}

          {!isSuccess && (
            <button
              onClick={onClose}
              className='text-sm text-gray-500 hover:underline'
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
