import { useEffect, useState } from 'react';
import { useSocket } from '@/lib/contexts/SocketContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Bell, X, Check } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface Notification {
  id: number;
  type: string;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export function NotificationBell() {
  const { user } = useAuth();
  const { onNotification, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load initial notifications
  useEffect(() => {
    if (!user?.id) return;
    loadNotifications();
  }, [user?.id]);

  // Listen for real-time notifications
  useEffect(() => {
    onNotification((data) => {
      console.log('🔔 New notification:', data);
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show toast notification
      toast.success(data.title, {
        icon: '🔔',
        duration: 5000,
      });
    });
  }, [onNotification]);

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data || []);

      const unread = (response.data || []).filter((n: Notification) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await api.post(`/notifications/${notificationId}/delete`);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      order_created: '📦',
      order_shipped: '🚚',
      order_delivered: '🏠',
      payment_pending: '⏳',
      payment_success: '✅',
      payment_failed: '❌',
      payment_expired: '⏰',
      promotion: '🎉',
    };
    return iconMap[type] || '🔔';
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-700" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-900">Notifikasi</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Tandai semua
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Tidak ada notifikasi</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900">{notification.title}</p>
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleString('id-ID')}
                      </p>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
