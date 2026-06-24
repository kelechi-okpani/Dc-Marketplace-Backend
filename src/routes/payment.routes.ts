import { Router, Request, Response } from 'express';
import axios from 'axios';
import asyncHandler from '../middleware/asyncHandler';
import { protect } from '../middleware/auth.middleware';
import Payment from '../models/Payment.model';
import { PromotionPackage } from '../models/Promotion.model';
import { AuthRequest } from '../types';

const router = Router();

router.get('/packages', asyncHandler(async (_req: Request, res: Response) => {
  const packages = await PromotionPackage.find({ isActive: true }).sort('price');
  res.status(200).json({ success: true, data: packages });
}));

router.post('/initialize', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { packageId, listingId } = req.body as { packageId: string; listingId: string };
  const pkg = await PromotionPackage.findById(packageId);
  if (!pkg) {
    res.status(404).json({ success: false, error: 'Package not found' });
    return;
  }

  const payment = await Payment.create({
    user: req.user!._id, listing: listingId, type: pkg.type,
    amount: pkg.price, gateway: 'paystack', status: 'pending',
    metadata: { packageId },
  });

  const response = await axios.post(
    'https://api.paystack.co/transaction/initialize',
    { email: req.user!.email ?? `${req.user!.phone}@shuk.ng`, amount: pkg.price * 100, reference: payment._id.toString() },
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  );

  res.status(200).json({ success: true, data: { payment, authorizationUrl: (response.data as any).data.authorization_url } });
}));

router.post('/webhook/paystack', asyncHandler(async (req: Request, res: Response) => {
  const event = req.body as { event: string; data: { reference: string } };
  if (event.event === 'charge.success') {
    const payment = await Payment.findById(event.data.reference);
    if (payment) {
      payment.status = 'success';
      payment.paidAt = new Date();
      payment.gatewayReference = event.data.reference;
      await payment.save();
    }
  }
  res.status(200).json({ received: true });
}));

router.get('/my', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const payments = await Payment.find({ user: req.user!._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: payments });
}));

export default router;