import { Router, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { protect, authorize } from '../middleware/auth.middleware';
import User from '../models/User.model';
import Listing from '../models/Listing.model';
import Report from '../models/Report.model';
import AuditLog from '../models/AuditLog.model';
import ReferralCampaign from '../models/Referral.model';
import { AuthRequest } from '../types';

const router = Router();
const adminOnly = [protect, authorize('admin', 'super_admin')];

router.get('/dashboard', ...adminOnly, asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [totalUsers, totalListings, activeListings, pendingModeration, openReports] = await Promise.all([
    User.countDocuments(), Listing.countDocuments(),
    Listing.countDocuments({ status: 'active' }),
    Listing.countDocuments({ moderationStatus: 'pending' }),
    Report.countDocuments({ status: 'open' }),
  ]);
  res.status(200).json({ success: true, data: { totalUsers, totalListings, activeListings, pendingModeration, openReports } });
}));

router.get('/users', ...adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, role, search, page = '1', limit = '20' } = req.query as Record<string, string>;
  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  if (role) query.role = role;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
    { phone: { $regex: search, $options: 'i' } },
  ];
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)),
    User.countDocuments(query),
  ]);
  res.status(200).json({ success: true, total, data: users });
}));

router.put('/users/:id/suspend', ...adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id,
    { status: 'suspended', suspensionReason: req.body.reason, suspendedAt: new Date(), suspendedUntil: req.body.until },
    { new: true }
  );
  await AuditLog.create({ actor: req.user!._id, action: 'user.suspend', targetType: 'user', targetId: req.params.id, details: req.body });
  res.status(200).json({ success: true, data: user });
}));

router.put('/users/:id/restore', ...adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, { status: 'active', suspensionReason: null }, { new: true });
  await AuditLog.create({ actor: req.user!._id, action: 'user.restore', targetType: 'user', targetId: req.params.id });
  res.status(200).json({ success: true, data: user });
}));

router.get('/referrals', ...adminOnly, asyncHandler(async (_req: AuthRequest, res: Response) => {
  const campaigns = await ReferralCampaign.find().sort({ totalRegistrations: -1 });
  res.status(200).json({ success: true, data: campaigns });
}));

router.post('/referrals', ...adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const campaign = await ReferralCampaign.create(req.body);
  res.status(201).json({ success: true, data: campaign });
}));

router.get('/audit-logs', ...adminOnly, asyncHandler(async (_req: AuthRequest, res: Response) => {
  const logs = await AuditLog.find().populate('actor', 'name email role').sort({ createdAt: -1 }).limit(100);
  res.status(200).json({ success: true, data: logs });
}));

export default router;