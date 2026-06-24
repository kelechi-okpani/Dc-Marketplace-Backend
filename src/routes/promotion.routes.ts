import { Router, Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { protect } from '../middleware/auth.middleware';
import { ActivePromotion } from '../models/Promotion.model';
import { AuthRequest } from '../types';

const router = Router();

router.get('/active', asyncHandler(async (_req: Request, res: Response) => {
  const promotions = await ActivePromotion.find({ isActive: true, endsAt: { $gte: new Date() } })
    .populate('listing', 'title images price state category')
    .populate('package', 'type name');
  res.status(200).json({ success: true, data: promotions });
}));

router.get('/my', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const promotions = await ActivePromotion.find({ seller: req.user!._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: promotions });
}));

export default router;