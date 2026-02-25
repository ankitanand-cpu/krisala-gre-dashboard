import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  href?: string;
}

export default function Logo({ 
  className = '', 
  href = '/'
}: LogoProps) {
  return (
    <Link href={href} className={`flex items-center ${className}`}>
      <Image
        src="/logo.webp"
        alt="Krisala Logo"
        width={200}
        height={100}
        className="w-auto h-8 sm:h-10 md:h-12 lg:h-14 xl:h-16"
        priority
      />
    </Link>
  );
}
