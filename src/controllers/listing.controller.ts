import { Response, NextFunction } from 'express';
import Listing from '../models/Listing.model';
import Category from '../models/Category.model';
import SavedListing from '../models/SavedListing.model';
import User from '../models/User.model';
import asyncHandler from '../middleware/asyncHandler';
import ErrorResponse from '../utils/errorResponse';
import { AuthRequest } from '../types';

export const getListings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { category, subcategory, state, city, lga, minPrice, maxPrice, condition,
    isFeatured, isBoosted, sort, page = '1', limit = '20' } = req.query as Record<string, string>;

  const query: Record<string, unknown> = { status: 'active', moderationStatus: 'approved' };
  if (category) query.category = category;
  if (subcategory) query.subcategory = subcategory;
  if (state) query.state = state;
  if (city) query.city = city;
  if (lga) query.lga = lga;
  if (condition) query.condition = condition;
  if (isFeatured === 'true') query.isFeatured = true;
  if (isBoosted === 'true') query.isBoosted = true;
  if (minPrice || maxPrice) {
    query.price = {} as Record<string, number>;
    if (minPrice) (query.price as Record<string, number>).$gte = Number(minPrice);
    if (maxPrice) (query.price as Record<string, number>).$lte = Number(maxPrice);
  }

  const sortObj: Record<string, 1 | -1> =
    sort === 'price_asc' ? { price: 1 }
    : sort === 'price_desc' ? { price: -1 }
    : sort === 'popular' ? { views: -1 }
    : sort === 'boost' ? { boostPriority: -1, createdAt: -1 }
    : { createdAt: -1 };

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const [listings, total] = await Promise.all([
    Listing.find(query)
      .populate('seller', 'name avatar isSellerVerified dcMemberVerified state city')
      .populate('category', 'name slug')
      .sort(sortObj).skip(skip).limit(limitNum),
    Listing.countDocuments(query),
  ]);

  res.status(200).json({ success: true, total, page: pageNum, pages: Math.ceil(total / limitNum), data: listings });
});

export const getListing = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const listing = await Listing.findById(req.params.id)
    .populate('seller', 'name avatar isSellerVerified dcMemberVerified state city totalListings createdAt')
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug');

  if (!listing) return next(new ErrorResponse('Listing not found', 404));

  const isOwner = req.user && req.user._id.toString() === (listing.seller as any)._id.toString();
  if (listing.status !== 'active' && !isOwner) return next(new ErrorResponse('Listing not found', 404));

  listing.views += 1;
  await listing.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: listing });
});

export const createListing = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  req.body.seller = req.user!._id;
  const category = await Category.findById(req.body.category);
  if (!category) return next(new ErrorResponse('Category not found', 404));
  const listing = await Listing.create(req.body);
  await User.findByIdAndUpdate(req.user!._id, { $inc: { totalListings: 1 } });
  res.status(201).json({ success: true, data: listing });
});

export const updateListing = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  let listing = await Listing.findById(req.params.id);
  if (!listing) return next(new ErrorResponse('Listing not found', 404));

  const isOwner = listing.seller.toString() === req.user!._id.toString();
  const isAdmin = ['admin', 'super_admin'].includes(req.user!.role);
  if (!isOwner && !isAdmin) return next(new ErrorResponse('Not authorized', 403));

  if (isOwner) { req.body.moderationStatus = 'pending'; req.body.status = 'pending_review'; }

  listing = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: listing });
});

export const deleteListing = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new ErrorResponse('Listing not found', 404));

  const isOwner = listing.seller.toString() === req.user!._id.toString();
  const isAdmin = ['admin', 'super_admin'].includes(req.user!.role);
  if (!isOwner && !isAdmin) return next(new ErrorResponse('Not authorized', 403));

  await listing.deleteOne();
  await User.findByIdAndUpdate(req.user!._id, { $inc: { totalListings: -1 } });
  res.status(200).json({ success: true, data: {} });
});

export const markSold = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new ErrorResponse('Listing not found', 404));
  if (listing.seller.toString() !== req.user!._id.toString()) return next(new ErrorResponse('Not authorized', 403));
  listing.isSold = true;
  listing.status = 'sold';
  listing.soldAt = new Date();
  await listing.save();
  res.status(200).json({ success: true, data: listing });
});

export const toggleSaveListing = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const existing = await SavedListing.findOne({ user: req.user!._id, listing: req.params.id });
  if (existing) {
    await existing.deleteOne();
    await Listing.findByIdAndUpdate(req.params.id, { $inc: { saves: -1 } });
    res.status(200).json({ success: true, saved: false });
    return;
  }
  await SavedListing.create({ user: req.user!._id, listing: req.params.id });
  await Listing.findByIdAndUpdate(req.params.id, { $inc: { saves: 1 } });
  res.status(200).json({ success: true, saved: true });
  return;
});

export const getMyListings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
  const query: Record<string, unknown> = { seller: req.user!._id };
  if (status) query.status = status;
  const [listings, total] = await Promise.all([
    Listing.find(query).populate('category', 'name slug').sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit)).limit(Number(limit)),
    Listing.countDocuments(query),
  ]);
  res.status(200).json({ success: true, total, data: listings });
});

export const getSavedListings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const saved = await SavedListing.find({ user: req.user!._id })
    .populate({ path: 'listing', populate: [{ path: 'seller', select: 'name avatar isSellerVerified' }, { path: 'category', select: 'name slug' }] })
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: saved.map((s) => s.listing).filter(Boolean) });
});