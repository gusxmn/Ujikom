'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface LogoutContextType {
  showLogoutConfirm: boolean;
  setShowLogoutConfirm: (show: boolean) => void;
}

const LogoutContext = createContext<LogoutContextType | undefined>(undefined);

export function LogoutProvider({ children }: { children: ReactNode }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <LogoutContext.Provider value={{ showLogoutConfirm, setShowLogoutConfirm }}>
      {children}
    </LogoutContext.Provider>
  );
}

export function useLogout() {
  const context = useContext(LogoutContext);
  if (!context) {
    throw new Error('useLogout must be used within LogoutProvider');
  }
  return context;
}
