'use client';

import { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { SidebarProvider } from '@/lib/contexts/SidebarContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSidebar } from '@/lib/contexts/SidebarContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogoutProvider, useLogout } from '@/lib/contexts/LogoutContext';

interface AdminLayoutProps {
  children: ReactNode;
}

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const { isCollapsed } = useSidebar();
  const { user, isLoading, logout } = useAuth();
  const { showLogoutConfirm, setShowLogoutConfirm } = useLogout();
  const router = useRouter();

  useEffect(() => {
    console.log('🔍 AdminLayout Check:', { user, isLoading, userRole: user?.role });
    
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      console.log('❌ Access Denied: User is not admin, redirecting to login');
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8 animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-300 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminHeader />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className={`flex-1 transition-all duration-300 ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}>
          <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full page-transition">
            {children}
          </div>
        </main>
      </div>

      {/* Logout Confirmation Modal - Rendered at Top Level */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h2 className="text-lg font-bold text-black mb-2">Confirm Logout</h2>
            <p className="text-gray-700 mb-6">Are you sure you want to log out?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                  router.push('/login');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <LogoutProvider>
        <AdminLayoutContent>
          {children}
        </AdminLayoutContent>
      </LogoutProvider>
    </SidebarProvider>
  );
}
