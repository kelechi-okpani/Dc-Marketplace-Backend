import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const listingStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'marketplace/listings',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
  } as object,
});

const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'marketplace/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
  } as object,
});

const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'marketplace/verification',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto',
  } as object,
});

export const uploadListingImages = multer({
  storage: listingStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
}).array('images', 10);

export const uploadProfileImage = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single('avatar');

export const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('document');

export { cloudinary };