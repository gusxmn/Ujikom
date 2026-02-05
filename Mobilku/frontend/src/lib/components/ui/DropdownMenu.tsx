import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

interface DropdownContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  asChild?: boolean;
}

const DropdownMenuContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
} | null>(null);

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

export const DropdownMenuTrigger: React.FC<DropdownTriggerProps> = ({
  children,
  className = '',
}) => {
  const context = React.useContext(DropdownMenuContext);

  if (!context) return null;

  return (
    <button
      className={`flex items-center gap-1 ${className}`}
      onClick={() => context.setIsOpen(!context.isOpen)}
    >
      {children}
      <ChevronDown size={16} />
    </button>
  );
};

export const DropdownMenuContent: React.FC<DropdownContentProps> = ({
  children,
  className = '',
  align = 'start',
}) => {
  const context = React.useContext(DropdownMenuContext);
  const alignClass = align === 'end' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0';

  if (!context || !context.isOpen) return null;

  return (
    <div
      className={`absolute ${alignClass} mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 ${className}`}
    >
      {children}
    </div>
  );
};

export const DropdownMenuLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`px-4 py-2 text-sm font-medium text-gray-700 ${className}`}>{children}</div>
);

export const DropdownMenuItem: React.FC<DropdownItemProps> = ({
  children,
  onClick,
  className = '',
  disabled = false,
}) => {
  const context = React.useContext(DropdownMenuContext);

  return (
    <button
      className={`block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      onClick={() => {
        if (!disabled) {
          onClick?.();
          context?.setIsOpen(false);
        }
      }}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export const DropdownMenuSeparator: React.FC = () => (
  <div className="h-px bg-gray-200 my-1" />
);
