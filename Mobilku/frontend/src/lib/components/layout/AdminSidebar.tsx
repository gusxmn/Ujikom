'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/lib/components/ui/Button';

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(true);
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
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white hover:bg-slate-800 p-2 rounded"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="font-bold">Admin Panel</span>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white shadow-lg z-50 transform transition-transform duration-300 pt-20 lg:pt-0 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              ⚙️
            </div>
            Admin
          </h2>
          <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-slate-800 rounded-lg">
            <User size={16} className="text-slate-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400">Logged in as</p>
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon size={20} />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight size={16} />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-700">
          <Button
            fullWidth
            variant="destructive"
            onClick={logout}
            className="flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </Button>
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
