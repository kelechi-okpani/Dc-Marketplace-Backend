import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

let io: Server;

interface SocketWithUser extends Socket {
  userId?: string;
}

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL as string, process.env.ADMIN_URL as string],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket: SocketWithUser, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: SocketWithUser) => {
    logger.info(`Socket connected: ${socket.id} (user: ${socket.userId})`);

    if (socket.userId) socket.join(socket.userId);

    socket.on('join_conversation', (conversationId: string) => socket.join(conversationId));
    socket.on('leave_conversation', (conversationId: string) => socket.leave(conversationId));

    socket.on('typing', ({ conversationId }: { conversationId: string }) => {
      socket.to(conversationId).emit('user_typing', { userId: socket.userId });
    });

    socket.on('stop_typing', ({ conversationId }: { conversationId: string }) => {
      socket.to(conversationId).emit('user_stop_typing', { userId: socket.userId });
    });

    socket.on('disconnect', () => logger.info(`Socket disconnected: ${socket.id}`));
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};