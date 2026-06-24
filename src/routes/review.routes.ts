import { Router, Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { protect } from '../middleware/auth.middleware';
import Review from '../models/Review.model';
import { AuthRequest } from '../types';

const router = Router();

router.post('/', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  req.body.reviewer = req.user!._id;
  const review = await Review.create(req.body);
  res.status(201).json({ success: true, data: review });
}));

router.get('/user/:userId', asyncHandler(async (req: Request, res: Response) => {
  const reviews = await Review.find({ reviewee: req.params.userId, isVisible: true })
    .populate('reviewer', 'name avatar')
    .populate('listing', 'title')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: reviews });
}));

export default router;