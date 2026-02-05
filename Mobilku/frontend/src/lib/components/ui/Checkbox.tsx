import React from 'react';

interface CheckboxProps {
  label?: string;
  className?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  [key: string]: any;
}

export const Checkbox = ({
  label,
  className = '',
  ...props
}: CheckboxProps) => {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        className={`w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer ${className}`}
        {...props}
      />
      {label && (
        <label className="ml-2 text-sm text-gray-700 cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
};
