'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSidebar } from '@/lib/contexts/SidebarContext';
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  LogOut,
  ChevronRight,
  Users,
  ChevronLeft,
  Ticket,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/lib/components/ui/Button';

export default function AdminSidebar() {
  const { isCollapsed, setIsCollapsed, isOpen, setIsOpen } = useSidebar();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      label: 'Products',
      href: '/admin/products',
      icon: ShoppingBag,
    },
    {
      label: 'Orders',
      href: '/admin/orders',
      icon: ShoppingCart,
    },
    {
      label: 'Coupons',
      href: '/admin/coupons',
      icon: Ticket,
    },
    {
      label: 'Users',
      href: '/admin/users',
      icon: Users,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 bg-white border-r-2 border-black shadow-lg z-50 transform transition-all duration-300 pt-16 lg:pt-0 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Logo/Header */}
        <div className="p-4 border-b-2 border-black flex items-center justify-between">
          <h2 className={`font-bold text-lg text-black ${isCollapsed ? 'hidden' : ''}`}>
            CMS Admin
          </h2>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-black hover:bg-gray-200 p-2 rounded hidden lg:block"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all ${
                    active
                      ? 'bg-black text-white'
                      : 'text-black hover:bg-gray-100'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} />
                  <span className={`flex-1 text-sm ${isCollapsed ? 'hidden' : ''}`}>{item.label}</span>
                  {active && !isCollapsed && <ChevronRight size={16} />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t-2 border-black">
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-all text-sm ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut size={18} />
            <span className={isCollapsed ? 'hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
