import { WebSocketGateway, SubscribeMessage, MessageBody, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
@Injectable()
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WebsocketGateway.name);
  server: Server;
  
  // Keep track of connected users
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  afterInit(server: Server) {
    this.server = server;
    this.logger.log('✅ WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.set(userId, client.id);
      this.logger.log(`👤 User connected: ${userId} (${client.id})`);
      // Notify all clients about active users
      this.server.emit('users-online', this.connectedUsers.size);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.delete(userId);
      this.logger.log(`👤 User disconnected: ${userId} (${client.id})`);
      this.server.emit('users-online', this.connectedUsers.size);
    }
  }

  /**
   * Send order status update to specific user
   */
  sendOrderUpdate(userId: number, data: any) {
    const socketId = this.connectedUsers.get(userId.toString());
    if (socketId) {
      this.server.to(socketId).emit('order-updated', data);
      this.logger.log(`📦 Order update sent to user ${userId}: ${data.status}`);
    }
  }

  /**
   * Send payment status update to specific user
   */
  sendPaymentUpdate(userId: number, data: any) {
    const socketId = this.connectedUsers.get(userId.toString());
    if (socketId) {
      this.server.to(socketId).emit('payment-updated', data);
      this.logger.log(`💳 Payment update sent to user ${userId}: ${data.status}`);
    }
  }

  /**
   * Send notification to specific user
   */
  sendNotification(userId: number, data: any) {
    const socketId = this.connectedUsers.get(userId.toString());
    if (socketId) {
      this.server.to(socketId).emit('notification', data);
      this.logger.log(`🔔 Notification sent to user ${userId}: ${data.title}`);
    }
  }

  /**
   * Broadcast notification to all users
   */
  broadcastNotification(data: any) {
    this.server.emit('notification-broadcast', data);
    this.logger.log(`📢 Broadcast notification: ${data.title}`);
  }

  /**
   * Send payment invoice link to user
   */
  sendPaymentInvoice(userId: number, data: any) {
    const socketId = this.connectedUsers.get(userId.toString());
    if (socketId) {
      this.server.to(socketId).emit('payment-invoice', data);
      this.logger.log(`📄 Payment invoice sent to user ${userId}: ${data.invoiceUrl}`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }
}
