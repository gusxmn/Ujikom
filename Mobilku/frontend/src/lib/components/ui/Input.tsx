import React, { ReactNode } from 'react';

interface InputProps {
  label?: string;
  error?: string;
  rightElement?: ReactNode;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}

export const Input = ({
  label,
  error,
  rightElement,
  className = '',
  ...props
}: InputProps) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
            error ? 'border-red-500' : ''
          } ${className}`}
          {...props}
        />
        {rightElement && <div className="absolute right-0 top-0 h-full flex items-center pr-3">{rightElement}</div>}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
