import { Router, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { protect } from '../middleware/auth.middleware';
import Notification from '../models/Notification.model';
import { AuthRequest } from '../types';

const router = Router();

router.get('/', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: req.user!._id }).sort({ createdAt: -1 }).limit(50),
    Notification.countDocuments({ user: req.user!._id, isRead: false }),
  ]);
  res.status(200).json({ success: true, data: notifications, unreadCount });
}));

router.put('/:id/read', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
  res.status(200).json({ success: true });
}));

router.put('/read-all', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  await Notification.updateMany({ user: req.user!._id, isRead: false }, { isRead: true, readAt: new Date() });
  res.status(200).json({ success: true });
}));

export default router;