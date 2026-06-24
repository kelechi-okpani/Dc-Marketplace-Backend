import { Router, Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { protect, authorize } from '../middleware/auth.middleware';
import Category from '../models/Category.model';

const router = Router();

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find({ parent: null, isActive: true }).populate('subcategories').sort('order');
  res.status(200).json({ success: true, data: categories });
}));

router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findOne({ slug: req.params.slug }).populate('subcategories');
  if (!category) {
    res.status(404).json({ success: false, error: 'Not found' });
    return;
  }
  res.status(200).json({ success: true, data: category });
}));

router.post('/', protect, authorize('admin', 'super_admin'), asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, data: category });
}));

router.put('/:id', protect, authorize('admin', 'super_admin'), asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: category });
}));

export default router;