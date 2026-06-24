import { Router, Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import Listing from '../models/Listing.model';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { q, state, category, minPrice, maxPrice, condition, sort, page = '1', limit = '20' } = req.query as Record<string, string>;
  if (!q) {
    res.status(400).json({ success: false, error: 'Search query required' });
    return;
  }

  const query: Record<string, unknown> = { $text: { $search: q }, status: 'active', moderationStatus: 'approved' };
  if (state) query.state = state;
  if (category) query.category = category;
  if (condition) query.condition = condition;
  if (minPrice || maxPrice) {
    query.price = {} as Record<string, number>;
    if (minPrice) (query.price as Record<string, number>).$gte = Number(minPrice);
    if (maxPrice) (query.price as Record<string, number>).$lte = Number(maxPrice);
  }

  const sortObj: Record<string, 1 | -1 | { $meta: string }> =
    sort === 'relevance' ? { score: { $meta: 'textScore' } }
    : sort === 'price_asc' ? { price: 1 }
    : sort === 'price_desc' ? { price: -1 }
    : { createdAt: -1 };

  const projection = sort === 'relevance' ? { score: { $meta: 'textScore' } } : {};

  const [listings, total] = await Promise.all([
    Listing.find(query, projection)
      .populate('seller', 'name avatar isSellerVerified')
      .populate('category', 'name slug')
      .sort(sortObj).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)),
    Listing.countDocuments(query),
  ]);

  res.status(200).json({ success: true, total, query: q, data: listings });
}));

export default router;