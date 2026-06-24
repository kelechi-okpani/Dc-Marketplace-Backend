import { Router, Request, Response, NextFunction } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { protect } from '../middleware/auth.middleware';
import User from '../models/User.model';
import { uploadProfileImage } from '../config/cloudinary';
import { AuthRequest } from '../types';

const router = Router();

router.get('/:id/profile', asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select(
    'name avatar state city isSellerVerified dcMemberVerified verificationBadge totalListings activeListings createdAt'
  );
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  res.status(200).json({ success: true, data: user });
}));

router.put('/profile', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const allowedFields = ['name', 'state', 'city', 'lga'];
  const updates: Record<string, string> = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const user = await User.findByIdAndUpdate(req.user!._id, updates, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: user });
}));

router.put('/avatar', protect, (req: Request, res: Response, next: NextFunction) => {
  uploadProfileImage(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const user = await User.findByIdAndUpdate((req as AuthRequest).user!._id, { avatar: req.file.path }, { new: true });
    res.status(200).json({ success: true, data: { avatar: user?.avatar } });
  });
});

router.put('/password', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id).select('+password');
  if (!user || !(await user.matchPassword(req.body.currentPassword))) {
    res.status(401).json({ success: false, error: 'Current password incorrect' });
    return;
  }
  user.password = req.body.newPassword;
  await user.save();
  res.status(200).json({ success: true, message: 'Password updated' });
}));

router.delete('/account', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  await User.findByIdAndUpdate(req.user!._id, { status: 'banned', email: null, phone: null });
  res.status(200).json({ success: true, message: 'Account deleted' });
}));

export default router;