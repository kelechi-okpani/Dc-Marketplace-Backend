import { Router, Request, Response, NextFunction } from 'express';
import { protect } from '../middleware/auth.middleware';
import { uploadListingImages, uploadDocument } from '../config/cloudinary';

const router = Router();

router.post('/listing-images', protect, (req: Request, res: Response, next: NextFunction) => {
  uploadListingImages(req, res, (err) => {
    if (err) return next(err);
    const files = (req.files as Express.Multer.File[]).map((f) => ({ url: f.path, publicId: f.filename }));
    res.status(200).json({ success: true, data: files });
  });
});

router.post('/document', protect, (req: Request, res: Response, next: NextFunction) => {
  uploadDocument(req, res, (err) => {
    if (err) return next(err);
    res.status(200).json({ success: true, data: { url: req.file!.path, publicId: req.file!.filename } });
  });
});

export default router;