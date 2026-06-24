import { Router } from 'express';
import { getListings, getListing, createListing, updateListing, deleteListing, markSold, toggleSaveListing, getMyListings, getSavedListings } from '../controllers/listing.controller';
import { protect, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, getListings);
router.get('/my', protect, getMyListings);
router.get('/saved', protect, getSavedListings);
router.get('/:id', optionalAuth, getListing);
router.post('/', protect, createListing);
router.put('/:id', protect, updateListing);
router.delete('/:id', protect, deleteListing);
router.put('/:id/sold', protect, markSold);
router.post('/:id/save', protect, toggleSaveListing);

export default router;