import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => (
  <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }: CardProps) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className = '' }: CardProps) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export const CardTitle = ({ children, className = '' }: CardTitleProps) => (
  <h2 className={`text-xl font-semibold text-gray-900 ${className}`}>{children}</h2>
);

export const CardDescription = ({ children, className = '' }: CardTitleProps) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`}>{children}</p>
);

export const CardFooter = ({ children, className = '' }: CardProps) => (
  <div className={`px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`}>
    {children}
  </div>
);
