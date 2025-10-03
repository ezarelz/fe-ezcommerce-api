'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister } from '@/hooks/useSession';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const registerSchema = z.object({
  name: z.string().min(2, 'Min. 2 characters'),
  email: z.email('Invalid email'),
  password: z.string().min(6, 'Min. 6 characters'),
});
type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const reg = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterInput) => {
    await reg.mutateAsync(values);
    router.replace('/login');
  };

  return (
    <main className='min-h-dvh grid place-items-center bg-zinc-100 p-4'>
      <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow'>
        <div className='mb-5'>
          <div className='font-semibold text-lg'>Shirt</div>
          <h1 className='mt-1 text-xl font-semibold'>Create account</h1>
          <p className='text-sm text-zinc-500'>Join and start shopping today</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div>
            <Input placeholder='Full name' {...register('name')} />
            {errors.name && (
              <p className='mt-1 text-xs text-red-500'>{errors.name.message}</p>
            )}
          </div>

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
            disabled={isSubmitting || reg.isPending}
          >
            {isSubmitting || reg.isPending ? 'Creating…' : 'Register'}
          </Button>
        </form>

        <p className='mt-4 text-center text-sm'>
          Already have an account?{' '}
          <Link href='/login' className='underline'>
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
