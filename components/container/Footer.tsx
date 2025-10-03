import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className='border-t border-zinc-200'>
      <div className='mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-3 md:gap-4 md:px-10 md:py-16'>
        {/* Brand & desc */}
        <div className='flex flex-col gap-4'>
          <div className='flex items-center gap-2'>
            <Image
              src='/icons/logo-mobile.svg'
              alt='Shirt logo'
              width={42}
              height={42}
            />
            <span className='text-lg font-bold text-zinc-950 lg:inline sm:inline'>
              Shirt
            </span>
          </div>
          <p className='text-sm text-zinc-900'>
            Explore a realm of style with our fashion e-commerce platform, where
            shopping is effortless. Experience a smooth journey with an
            extensive selection of trendy apparel, all delivered directly to
            your home.
          </p>
          <h3 className='text-sm leading-sm -tracking-2 font-bold'>
            Follow on Social Media
          </h3>
          <div className='mt-2 flex items-center gap-3'>
            {[
              { href: '#', alt: 'Facebook', src: '/icons/fb_ico.svg' },
              { href: '#', alt: 'Instagram', src: '/icons/insta_ico.svg' },
              { href: '#', alt: 'LinkedIn', src: '/icons/linkedin_ico.svg' },
              { href: '#', alt: 'TikTok', src: '/icons/tiktok_ico.svg' },
            ].map((s) => (
              <Link
                key={s.alt}
                href={s.href}
                className='flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-100'
              >
                <Image src={s.src} alt={s.alt} width={20} height={20} />
              </Link>
            ))}
          </div>
        </div>

        {/* E-Commerce */}
        <div>
          <h3 className='text-sm font-bold'>E-Commerce</h3>
          <ul className='mt-4 space-y-3 text-sm'>
            <li>
              <Link href='#'>About Us</Link>
            </li>
            <li>
              <Link href='#'>Terms &amp; Condition</Link>
            </li>
            <li>
              <Link href='#'>Privacy Policy</Link>
            </li>
            <li>
              <Link href='#'>Blog</Link>
            </li>
          </ul>
        </div>

        {/* Help */}
        <div>
          <h3 className='text-sm font-bold'>Help</h3>
          <ul className='mt-4 space-y-3 text-sm'>
            <li>
              <Link href='#'>How to Transact</Link>
            </li>
            <li>
              <Link href='#'>Payment Method</Link>
            </li>
            <li>
              <Link href='#'>How to Register</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
