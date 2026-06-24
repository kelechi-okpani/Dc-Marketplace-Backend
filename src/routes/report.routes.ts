import { Router, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { protect, authorize } from '../middleware/auth.middleware';
import Report from '../models/Report.model';
import Listing from '../models/Listing.model';
import User from '../models/User.model';
import { AuthRequest } from '../types';

const router = Router();

router.post('/', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  req.body.reporter = req.user!._id;
  const report = await Report.create(req.body);
  if (req.body.targetType === 'listing' && req.body.targetListing)
    await Listing.findByIdAndUpdate(req.body.targetListing, { $inc: { reportCount: 1 } });
  if (req.body.targetType === 'user' && req.body.targetUser)
    await User.findByIdAndUpdate(req.body.targetUser, { $inc: { reportCount: 1 } });
  res.status(201).json({ success: true, data: report });
}));

router.get('/', protect, authorize('moderator', 'admin', 'super_admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, priority, targetType, page = '1', limit = '20' } = req.query as Record<string, string>;
  const query: Record<string, string> = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (targetType) query.targetType = targetType;

  const [reports, total] = await Promise.all([
    Report.find(query)
      .populate('reporter', 'name email phone')
      .populate('targetListing', 'title status')
      .populate('targetUser', 'name email phone status')
      .sort({ priority: -1, createdAt: 1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)),
    Report.countDocuments(query),
  ]);
  res.status(200).json({ success: true, total, data: reports });
}));

router.put('/:id/resolve', protect, authorize('moderator', 'admin', 'super_admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { ...req.body, resolvedBy: req.user!._id, resolvedAt: new Date() },
    { new: true }
  );
  res.status(200).json({ success: true, data: report });
}));

export default router;