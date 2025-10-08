'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type {
  CreateProductInput,
  SellerProduct,
} from '@/types/seller-products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type Props = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<SellerProduct>;
  onSubmit: (payload: CreateProductInput) => void;
  isSubmitting?: boolean;
};

export default function ProductForm({
  mode,
  defaultValues,
  onSubmit,
  isSubmitting,
}: Props) {
  const { register, handleSubmit, control, reset, setValue, watch } =
    useForm<CreateProductInput>({
      defaultValues: {
        title: defaultValues?.title ?? '',
        description: defaultValues?.description ?? '',
        price: defaultValues?.price ?? 0,
        stock: defaultValues?.stock ?? 0,
        categoryId: defaultValues?.categoryId ?? 0,
        imagesUrl: defaultValues?.imagesUrl ?? [],
        isActive: defaultValues?.isActive ?? true,
      },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'imagesUrl',
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        title: defaultValues.title ?? '',
        description: defaultValues.description ?? '',
        price: defaultValues.price ?? 0,
        stock: defaultValues.stock ?? 0,
        categoryId: defaultValues.categoryId ?? 0,
        imagesUrl: defaultValues.imagesUrl ?? [],
        isActive: defaultValues.isActive ?? true,
      });
    }
  }, [defaultValues, reset]);

  return (
    <form
      className='grid gap-3'
      onSubmit={handleSubmit((values) => {
        const filesInput = document.getElementById(
          'images'
        ) as HTMLInputElement | null;
        const files = filesInput?.files
          ? Array.from(filesInput.files)
          : undefined;
        onSubmit({ ...values, images: files });
      })}
    >
      <div className='grid gap-1.5'>
        <Label htmlFor='title'>Product name</Label>
        <Input id='title' {...register('title', { required: true })} />
      </div>

      <div className='grid gap-1.5'>
        <Label htmlFor='categoryId'>Category ID</Label>
        <Input
          id='categoryId'
          type='number'
          {...register('categoryId', { valueAsNumber: true, required: true })}
        />
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <div className='grid gap-1.5'>
          <Label htmlFor='price'>Price</Label>
          <Input
            id='price'
            type='number'
            {...register('price', { valueAsNumber: true, required: true })}
          />
        </div>
        <div className='grid gap-1.5'>
          <Label htmlFor='stock'>Stock</Label>
          <Input
            id='stock'
            type='number'
            {...register('stock', { valueAsNumber: true, required: true })}
          />
        </div>
      </div>

      <div className='grid gap-1.5'>
        <Label htmlFor='description'>Description</Label>
        <Textarea id='description' rows={4} {...register('description')} />
      </div>

      <div className='grid gap-1.5'>
        <Label htmlFor='images'>Images (JPG/PNG/WEBP, max 5MB/each)</Label>
        <Input id='images' type='file' multiple accept='image/*' />
      </div>

      {/* imagesUrl array (opsional) */}
      <div className='grid gap-1.5'>
        <Label>Images URL (optional)</Label>
        <div className='space-y-2'>
          {fields.map((f, i) => (
            <div key={f.id} className='flex items-center gap-2'>
              <Input
                {...register(`imagesUrl.${i}` as const)}
                placeholder='https://...'
              />
              <Button type='button' variant='ghost' onClick={() => remove(i)}>
                Remove
              </Button>
            </div>
          ))}
          <Button type='button' variant='outline' onClick={() => append('')}>
            + Add URL
          </Button>
        </div>
      </div>

      <div className='flex items-center gap-2 pt-1'>
        <Switch
          id='isActive'
          checked={watch('isActive') ?? true}
          onCheckedChange={(v) => setValue('isActive', v)}
        />
        <Label htmlFor='isActive'>Active</Label>
      </div>

      <Button type='submit' className='mt-2' disabled={isSubmitting}>
        {mode === 'create' ? 'Save' : 'Update'}
      </Button>
    </form>
  );
}
