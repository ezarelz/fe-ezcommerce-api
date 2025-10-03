'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useLogout } from '@/hooks/useSession';
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
  children: React.ReactNode; // tombol/trigger
  redirectTo?: string; // default '/'
  onAfter?: () => void; // optional callback setelah logout
};

export default function LogoutConfirm({
  children,
  redirectTo = '/',
  onAfter,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const doLogout = useLogout();

  const handleConfirm = () => {
    doLogout(); // clear token + cache /me
    setOpen(false);
    onAfter?.();
    router.replace(redirectTo);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className='sm:max-w-md'>
        <AlertDialogHeader>
          <AlertDialogTitle>Logout</AlertDialogTitle>
          <AlertDialogDescription>
            You will need to sign in again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className='bg-red-600 text-white hover:bg-red-600/90'
          >
            Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
