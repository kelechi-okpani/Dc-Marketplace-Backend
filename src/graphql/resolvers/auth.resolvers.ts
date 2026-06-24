import crypto from 'crypto';
import User from '../../models/User.model';
import ReferralCampaign from '../../models/Referral.model';
import { requireAuth } from '../../middleware/auth.middleware';
import { AuthenticationError, UserInputError } from 'apollo-server-express';
import sendEmail from '../../utils/sendEmail';
import sendSMS from '../../utils/sendSMS';
import { GraphQLContext, IUser } from '../../types';

const sendTokenResponse = (user: IUser) => ({
  token: user.getSignedJwtToken(),
  user,
});

export default {
  Query: {
    me: (_: unknown, __: unknown, context: GraphQLContext) => {
      return requireAuth(context);
    },
  },

  Mutation: {
    register: async (_: unknown, { input }: { input: Record<string, string> }) => {
      const { name, email, phone, password, state, city, referralCode } = input;

      if (!email && !phone) throw new UserInputError('Provide email or phone');

      let referralCampaign = null;
      if (referralCode) {
        referralCampaign = await ReferralCampaign.findOne({ code: referralCode.toUpperCase(), isActive: true });
      }

      const user = await User.create({ name, email, phone, password, state, city, referralSource: referralCode ?? null });

      if (referralCampaign) {
        referralCampaign.totalRegistrations += 1;
        await referralCampaign.save();
      }

      if (email) {
        const token = user.getEmailVerificationToken();
        await user.save({ validateBeforeSave: false });
        await sendEmail({
          email: user.email!,
          subject: 'Welcome to Shuk - Verify Your Email',
          template: 'emailVerification',
          data: { name: user.name, verifyUrl: `${process.env.CLIENT_URL}/verify-email/${token}` },
        });
      }

      if (phone) {
        const otp = user.generateOTP();
        await user.save({ validateBeforeSave: false });
        await sendSMS({ to: phone, message: `Your Shuk verification code is: ${otp}` });
      }

      return sendTokenResponse(user);
    },

    login: async (_: unknown, { input }: { input: Record<string, string> }) => {
      const { email, phone, password } = input;
      if (!password || (!email && !phone)) throw new UserInputError('Provide credentials');

      const query = email ? { email } : { phone };
      const user = await User.findOne(query).select('+password');
      if (!user || !(await user.matchPassword(password))) {
        throw new AuthenticationError('Invalid credentials');
      }

      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      return sendTokenResponse(user);
    },

    logout: () => true,

    verifyEmail: async (_: unknown, { token }: { token: string }) => {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpire: { $gt: Date.now() },
      });
      if (!user) throw new UserInputError('Invalid or expired token');
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpire = undefined;
      await user.save();
      return true;
    },

    verifyPhone: async (_: unknown, { otp }: { otp: string }, context: GraphQLContext) => {
      const authUser = requireAuth(context);
      const user = await User.findById(authUser._id);
      if (!user || user.phoneOTP !== otp || (user.phoneOTPExpire && user.phoneOTPExpire < new Date())) {
        throw new UserInputError('Invalid or expired OTP');
      }
      user.isPhoneVerified = true;
      user.phoneOTP = undefined;
      user.phoneOTPExpire = undefined;
      await user.save();
      return true;
    },

    forgotPassword: async (_: unknown, { email }: { email: string }) => {
      const user = await User.findOne({ email });
      if (!user) throw new UserInputError('No user with that email');
      const resetToken = user.getResetPasswordToken();
      await user.save({ validateBeforeSave: false });
      await sendEmail({
        email: user.email!,
        subject: 'Shuk - Password Reset',
        template: 'passwordReset',
        data: { name: user.name, resetUrl: `${process.env.CLIENT_URL}/reset-password/${resetToken}` },
      });
      return true;
    },

    resetPassword: async (_: unknown, { token, newPassword }: { token: string; newPassword: string }) => {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
      });
      if (!user) throw new UserInputError('Invalid or expired token');
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return sendTokenResponse(user);
    },
  },
};