import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

import connectDB from './config/database';
import connectRedis from './config/redis';
import { initSocket } from './config/socket';
import errorHandler from './middleware/errorHandler';
import logger from './utils/logger';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import listingRoutes from './routes/listing.routes';
import categoryRoutes from './routes/category.routes';
import chatRoutes from './routes/chat.routes';
import paymentRoutes from './routes/payment.routes';
import promotionRoutes from './routes/promotion.routes';
import reportRoutes from './routes/report.routes';
import reviewRoutes from './routes/review.routes';
import referralRoutes from './routes/referral.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import moderationRoutes from './routes/moderation.routes';
import searchRoutes from './routes/search.routes';
import uploadRoutes from './routes/upload.routes';

const app = express();
const server = http.createServer(app);

connectDB();
connectRedis();
initSocket(server);

app.use(helmet());
app.use(mongoSanitize());

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});
app.use('/api', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cors({
  origin: [process.env.CLIENT_URL as string, process.env.ADMIN_URL as string],
  credentials: true,
}));

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', env: process.env.NODE_ENV });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/listings', listingRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/promotions', promotionRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/referrals', referralRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/moderation', moderationRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/upload', uploadRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Shuk API running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err: Error) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

export default app;