'use client';

import { useState } from 'react';
import { Bell, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSidebar } from '@/lib/contexts/SidebarContext';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {}

export default function AdminHeader() {
  const [notifications, setNotifications] = useState(3); // Dummy notification count
  const [showNotifications, setShowNotifications] = useState(false);
  const { logout } = useAuth();
  const { isOpen, setIsOpen } = useSidebar();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="bg-white border-b-2 border-black px-4 lg:px-6 py-2 flex items-center z-50 relative min-h-16">
      {/* Left Section: Mobile Menu Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden p-2 rounded hover:bg-gray-100 transition"
        title={isOpen ? 'Close menu' : 'Open menu'}
      >
        {isOpen ? <X size={20} className="text-black" /> : <Menu size={20} className="text-black" />}
      </button>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Right Section - Icons */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded hover:bg-gray-100 transition"
            title="Notifications"
          >
            <Bell size={20} className="text-black" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {notifications}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-black rounded-lg shadow-lg p-4 z-50">
              <h3 className="font-bold text-black mb-3 text-sm">Notifications</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-600">
                  <p className="text-sm font-semibold text-black">New Order</p>
                  <p className="text-xs text-gray-600">Order #12345 has been placed</p>
                </div>
                <div className="p-2 bg-green-50 rounded border-l-4 border-green-600">
                  <p className="text-sm font-semibold text-black">Payment Received</p>
                  <p className="text-xs text-gray-600">Payment for order #12344 confirmed</p>
                </div>
                <div className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-600">
                  <p className="text-sm font-semibold text-black">Low Stock</p>
                  <p className="text-xs text-gray-600">Toyota Fortuner stock is low</p>
                </div>
              </div>
              <button className="mt-3 w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All
              </button>
            </div>
          )}
        </div>

        {/* Divider - Desktop Only */}
        <div className="w-px h-6 bg-gray-300 hidden lg:block mx-1"></div>

        {/* Settings - Desktop Only */}
        <button
          title="Settings"
          className="p-2 rounded hover:bg-gray-100 transition hidden lg:block"
        >
          <Settings size={20} className="text-black" />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="p-2 rounded hover:bg-red-100 transition"
        >
          <LogOut size={20} className="text-red-600" />
        </button>
      </div>
    </div>
  );
}
