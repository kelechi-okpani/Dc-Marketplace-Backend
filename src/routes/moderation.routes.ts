import { Router, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { protect, authorize } from '../middleware/auth.middleware';
import Listing from '../models/Listing.model';
import AuditLog from '../models/AuditLog.model';
import Notification from '../models/Notification.model';
import { AuthRequest } from '../types';

const router = Router();
const modRoles = ['moderator', 'admin', 'super_admin'];

router.get('/queue', protect, authorize(...modRoles), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const [listings, total] = await Promise.all([
    Listing.find({ moderationStatus: 'pending' })
      .populate('seller', 'name email phone isSellerVerified reportCount')
      .populate('category', 'name isHighRisk')
      .sort({ createdAt: 1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)),
    Listing.countDocuments({ moderationStatus: 'pending' }),
  ]);
  res.status(200).json({ success: true, total, data: listings });
}));

router.put('/listings/:id/approve', protect, authorize(...modRoles), asyncHandler(async (req: AuthRequest, res: Response) => {
  const listing = await Listing.findByIdAndUpdate(req.params.id,
    { moderationStatus: 'approved', status: 'active', moderatedBy: req.user!._id, moderatedAt: new Date() },
    { new: true }
  );
  await AuditLog.create({ actor: req.user!._id, action: 'listing.approve', targetType: 'listing', targetId: req.params.id });
  await Notification.create({
    user: listing!.seller, type: 'listing_approved', title: 'Listing Approved',
    body: `Your listing "${listing!.title}" is now live.`, data: { listingId: listing!._id },
  });
  res.status(200).json({ success: true, data: listing });
}));

router.put('/listings/:id/reject', protect, authorize(...modRoles), asyncHandler(async (req: AuthRequest, res: Response) => {
  const listing = await Listing.findByIdAndUpdate(req.params.id,
    { moderationStatus: 'rejected', status: 'rejected', rejectionReason: req.body.reason,
      moderationNote: req.body.note, moderatedBy: req.user!._id, moderatedAt: new Date() },
    { new: true }
  );
  await AuditLog.create({ actor: req.user!._id, action: 'listing.reject', targetType: 'listing', targetId: req.params.id, details: req.body });
  await Notification.create({
    user: listing!.seller, type: 'listing_rejected', title: 'Listing Not Approved',
    body: `Your listing "${listing!.title}" was not approved. Reason: ${req.body.reason}`,
    data: { listingId: listing!._id },
  });
  res.status(200).json({ success: true, data: listing });
}));

router.put('/listings/:id/flag', protect, authorize(...modRoles), asyncHandler(async (req: AuthRequest, res: Response) => {
  const listing = await Listing.findByIdAndUpdate(req.params.id,
    { isFlagged: true, moderationStatus: 'flagged', moderatedBy: req.user!._id, moderationNote: req.body.note },
    { new: true }
  );
  await AuditLog.create({ actor: req.user!._id, action: 'listing.flag', targetType: 'listing', targetId: req.params.id });
  res.status(200).json({ success: true, data: listing });
}));

export default router;