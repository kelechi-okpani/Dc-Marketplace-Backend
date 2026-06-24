import { Router, Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import ReferralCampaign from '../models/Referral.model';

const router = Router();

router.get('/:code', asyncHandler(async (req: Request, res: Response) => {
  const campaign = await ReferralCampaign.findOne({ code: req.params.code.toUpperCase(), isActive: true });
  if (!campaign) {
    res.status(404).json({ success: false, error: 'Invalid referral code' });
    return;
  }

  campaign.totalClicks += 1;
  await campaign.save();

  res.status(200).json({
    success: true,
    data: { name: campaign.name, type: campaign.type, stateCode: campaign.stateCode, churchName: campaign.churchName },
  });
}));

export default router;