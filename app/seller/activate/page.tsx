import SellerActivateForm from '@/components/seller/SellerActivateForm';

export default function SellerActivatePage() {
  return (
    <main className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 p-6'>
      <div className='w-full max-w-md bg-white dark:bg-neutral-900 shadow-xl rounded-2xl p-6 space-y-5'>
        {/* Header Section */}
        <div className='text-center space-y-1'>
          <h1 className='text-2xl font-semibold text-neutral-900 dark:text-white'>
            Open Your Store Today
          </h1>
          <p className='text-gray-500 text-sm'>
            Start selling in minutes and reach thousands of customers instantly.
          </p>
        </div>

        {/* Form Section */}
        <SellerActivateForm />

        {/* Footer hint */}
        <p className='text-center text-xs text-gray-400 pt-2'>
          Once your store is created, you can manage it anytime in your Seller
          Dashboard.
        </p>
      </div>
    </main>
  );
}
