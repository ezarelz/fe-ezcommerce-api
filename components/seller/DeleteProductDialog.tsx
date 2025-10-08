// components/seller/DeleteProductDialog.tsx
'use client';

import { ReactNode, useState } from 'react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

type Props = {
  /** Trigger yang akan membuka dialog (mis. icon button) */
  children: ReactNode;
  /** Dipanggil saat klik Delete. Tutup dialog otomatis setelah resolve. */
  onConfirm: () => Promise<void> | void;
  /** Tampilkan loading di tombol Delete (opsional, kalau kamu kontrol di luar) */
  loading?: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

export default function DeleteProductDialog({
  children,
  onConfirm,
  loading,
  title = 'Delete',
  description = 'The product will be permanently removed from your store.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    try {
      setBusy(true);
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy || loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={busy || loading}
            className='bg-red-600 text-white hover:bg-red-700 focus:ring-red-600'
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
