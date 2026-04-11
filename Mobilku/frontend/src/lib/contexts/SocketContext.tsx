import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onOrderUpdate: (callback: (data: any) => void) => void;
  onPaymentUpdate: (callback: (data: any) => void) => void;
  onNotification: (callback: (data: any) => void) => void;
  onPaymentInvoice: (callback: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef<{
    orderUpdate: Function[];
    paymentUpdate: Function[];
    notification: Function[];
    paymentInvoice: Function[];
  }>({
    orderUpdate: [],
    paymentUpdate: [],
    notification: [],
    paymentInvoice: [],
  });

  useEffect(() => {
    if (!user || !user.id) return;

    console.log('🔌 [Socket] Connecting to WebSocket server...');

    const socketIo = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001', {
      query: { userId: user.id },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketIo.on('connect', () => {
      console.log('✅ [Socket] Connected to WebSocket server');
      setIsConnected(true);
    });

    socketIo.on('disconnect', () => {
      console.log('❌ [Socket] Disconnected from WebSocket server');
      setIsConnected(false);
    });

    socketIo.on('error', (error) => {
      console.error('❌ [Socket] Connection error:', error);
    });

    // Order update listener
    socketIo.on('order-updated', (data) => {
      console.log('📦 [Socket] Order update received:', data);
      callbacksRef.current.orderUpdate.forEach((cb) => cb(data));
    });

    // Payment update listener
    socketIo.on('payment-updated', (data) => {
      console.log('💳 [Socket] Payment update received:', data);
      callbacksRef.current.paymentUpdate.forEach((cb) => cb(data));
    });

    // Notification listener
    socketIo.on('notification', (data) => {
      console.log('🔔 [Socket] Notification received:', data);
      callbacksRef.current.notification.forEach((cb) => cb(data));
    });

    // Payment invoice listener
    socketIo.on('payment-invoice', (data) => {
      console.log('📄 [Socket] Payment invoice received:', data);
      callbacksRef.current.paymentInvoice.forEach((cb) => cb(data));
    });

    setSocket(socketIo);

    return () => {
      console.log('🔌 [Socket] Closing WebSocket connection');
      socketIo.disconnect();
    };
  }, [user?.id]);

  const onOrderUpdate = (callback: (data: any) => void) => {
    callbacksRef.current.orderUpdate.push(callback);
  };

  const onPaymentUpdate = (callback: (data: any) => void) => {
    callbacksRef.current.paymentUpdate.push(callback);
  };

  const onNotification = (callback: (data: any) => void) => {
    callbacksRef.current.notification.push(callback);
  };

  const onPaymentInvoice = (callback: (data: any) => void) => {
    callbacksRef.current.paymentInvoice.push(callback);
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, onOrderUpdate, onPaymentUpdate, onNotification, onPaymentInvoice }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
