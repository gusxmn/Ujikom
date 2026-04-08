import React, { useState } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({ 
  open, 
  onOpenChange, 
  children,
  closeOnBackdropClick = true,
  closeOnEscape = true 
}) => {
  React.useEffect(() => {
    if (open) {
      // Disable scroll on body
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      // Re-enable scroll on body
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, [open]);

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEscape && open) {
      onOpenChange(false);
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 cursor-default"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            pointerEvents: 'auto'
          }}
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
          role="presentation"
        />
      )}
      <DialogContext.Provider value={{ open, onOpenChange, closeOnBackdropClick, closeOnEscape }}>
        {children}
      </DialogContext.Provider>
    </>
  );
};

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}>({
  open: false,
  onOpenChange: () => {},
  closeOnBackdropClick: true,
  closeOnEscape: true,
});

export const DialogContent: React.FC<DialogContentProps> = ({ children, className = '' }) => {
  const { open, onOpenChange, closeOnBackdropClick = true } = React.useContext(DialogContext);

  if (!open) return null;

  const handleCloseClick = () => {
    if (closeOnBackdropClick) {
      onOpenChange(false);
    }
  };

  return (
    <div
      className={`fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg z-50 w-full max-w-md p-6 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {closeOnBackdropClick && (
        <button
          onClick={handleCloseClick}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      )}
      {children}
    </div>
  );
};

export const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

export const DialogTitle: React.FC<DialogTitleProps> = ({ children, className = '' }) => (
  <h2 className={`text-xl font-bold text-gray-900 ${className}`}>{children}</h2>
);

export const DialogDescription: React.FC<DialogDescriptionProps> = ({
  children,
  className = '',
}) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`}>{children}</p>
);

export const DialogFooter: React.FC<DialogFooterProps> = ({ children, className = '' }) => (
  <div className={`flex gap-3 justify-end mt-6 ${className}`}>{children}</div>
);
