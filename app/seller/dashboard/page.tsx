// app/seller/dashboard/page.tsx
'use client';

import Image from 'next/image';
import SellerShell from '@/components/seller/SellerShell';
import { useSellerOrderItems } from '@/hooks/seller/useSellerOrdersItems';

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}) {
  return (
    <div className='rounded-xl border p-4'>
      <div className='flex items-center gap-2 text-sm text-neutral-600'>
        {icon}
        <span>{title}</span>
      </div>
      <div className='mt-2 text-2xl font-semibold'>{value}</div>
    </div>
  );
}

const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);

export default function SellerDashboardPage() {
  const { metrics, isLoading, isError } = useSellerOrderItems({
    status: 'COMPLETED',
    take: 200,
  });

  return (
    <SellerShell title='Dashboard'>
      <h1 className='mb-4 text-2xl font-bold'>Dashboard</h1>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          icon={
            <Image src='/icons/grid-dots.svg' alt='' width={18} height={18} />
          }
          title='Total Product'
          value={isLoading ? '…' : metrics.totalProducts}
        />
        <StatCard
          icon={<Image src='/icons/file.svg' alt='' width={18} height={18} />}
          title='Total Orders'
          value={isLoading ? '…' : metrics.totalOrders}
        />
        <StatCard
          icon={
            <Image src='/icons/revenue-ico.svg' alt='' width={18} height={18} />
          }
          title='Total Revenue'
          value={isLoading ? '…' : rp(metrics.totalRevenue)}
        />
        <StatCard
          icon={
            <Image src='/icons/checklist.svg' alt='' width={18} height={18} />
          }
          title='Completed Orders'
          value={isLoading ? '…' : metrics.completedOrders}
        />
      </div>

      {isError && (
        <p className='mt-6 text-sm text-rose-600'>
          Gagal memuat data dashboard.
        </p>
      )}
    </SellerShell>
  );
}
