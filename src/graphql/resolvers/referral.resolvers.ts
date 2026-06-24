import ReferralCampaign from '../../models/Referral.model';
import { UserInputError } from 'apollo-server-express';

export default {
  Query: {
    referralCampaign: async (_: unknown, { code }: { code: string }) => {
      const campaign = await ReferralCampaign.findOne({ code: code.toUpperCase(), isActive: true });
      if (!campaign) throw new UserInputError('Invalid referral code');
      campaign.totalClicks += 1;
      await campaign.save();
      return campaign;
    },
  },
};