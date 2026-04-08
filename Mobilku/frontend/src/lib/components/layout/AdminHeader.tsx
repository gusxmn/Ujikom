'use client';

import { useState } from 'react';
import { Bell, Settings, LogOut, Menu, X, Trash2 } from 'lucide-react';
import { useSidebar } from '@/lib/contexts/SidebarContext';
import { useLogout } from '@/lib/contexts/LogoutContext';

interface Notification {
  id: number;
  type: 'order' | 'payment' | 'stock';
  title: string;
  message: string;
  color: string;
}

interface AdminHeaderProps {}

export default function AdminHeader() {
  const [notificationList, setNotificationList] = useState<Notification[]>([
    {
      id: 1,
      type: 'order',
      title: 'New Order',
      message: 'Order #12345 has been placed',
      color: 'blue',
    },
    {
      id: 2,
      type: 'payment',
      title: 'Payment Received',
      message: 'Payment for order #12344 confirmed',
      color: 'green',
    },
    {
      id: 3,
      type: 'stock',
      title: 'Low Stock',
      message: 'Toyota Fortuner stock is low',
      color: 'yellow',
    },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { isOpen, setIsOpen } = useSidebar();
  const { setShowLogoutConfirm } = useLogout();

  const handleDeleteNotification = (id: number) => {
    setNotificationList(notificationList.filter(notif => notif.id !== id));
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
            {notificationList.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {notificationList.length}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-black rounded-lg shadow-lg p-4 z-50">
              <h3 className="font-bold text-black mb-3 text-sm">Notifications</h3>
              {notificationList.length > 0 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {notificationList.map(notif => {
                    const bgColor = notif.color === 'blue' ? 'bg-blue-50 border-blue-600' : 
                                   notif.color === 'green' ? 'bg-green-50 border-green-600' : 
                                   'bg-yellow-50 border-yellow-600';
                    return (
                      <div key={notif.id} className={`p-2 ${bgColor} rounded border-l-4 flex items-start justify-between group hover:bg-opacity-70 transition`}>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-black">{notif.title}</p>
                          <p className="text-xs text-gray-600">{notif.message}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteNotification(notif.id)}
                          className="ml-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete notification"
                        >
                          <Trash2 size={14} className="text-red-600" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">No notifications</p>
              )}
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
          onClick={() => setShowLogoutConfirm(true)}
          title="Logout"
          className="p-2 rounded hover:bg-red-100 transition"
        >
          <LogOut size={20} className="text-red-600" />
        </button>
      </div>
    </div>
  );
}
