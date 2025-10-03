'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '@/hooks/useSession';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(6, 'Min. 6 characters'),
});
type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get('return_to') || '/products';

  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput) => {
    await login.mutateAsync(values);
    router.replace(returnTo);
  };

  return (
    <main className='min-h-dvh grid place-items-center bg-zinc-100 p-4'>
      <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow'>
        <div className='mb-5'>
          <div className='font-semibold text-lg'>Shirt</div>
          <h1 className='mt-1 text-xl font-semibold'>Login</h1>
          <p className='text-sm text-zinc-500'>
            Access your account and start shopping in seconds
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div>
            <Input type='email' placeholder='Email' {...register('email')} />
            {errors.email && (
              <p className='mt-1 text-xs text-red-500'>
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Input
              type='password'
              placeholder='Password'
              {...register('password')}
            />
            {errors.password && (
              <p className='mt-1 text-xs text-red-500'>
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type='submit'
            className='w-full'
            disabled={isSubmitting || login.isPending}
          >
            {isSubmitting || login.isPending ? 'Signing in…' : 'Login'}
          </Button>
        </form>

        <p className='mt-4 text-center text-sm'>
          Don’t have an account?{' '}
          <Link href='/register' className='underline'>
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
