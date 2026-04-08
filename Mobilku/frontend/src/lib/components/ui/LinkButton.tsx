import Link from 'next/link';
import { ReactNode } from 'react';

interface LinkButtonProps {
  href: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: ReactNode;
}

export const LinkButton = ({
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
}: LinkButtonProps) => {
  const baseStyles = 'font-medium rounded-lg transition flex items-center justify-center inline-flex';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    outline: 'border border-gray-300 hover:border-gray-400 text-gray-700',
    ghost: 'text-gray-700 hover:bg-gray-100',
    destructive: 'bg-red-600 hover:bg-red-700 text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const linkClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <Link href={href} className={linkClasses}>
      {children}
    </Link>
  );
};
