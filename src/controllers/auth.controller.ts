import crypto from 'crypto';
import { Response, NextFunction } from 'express';
import User from '../models/User.model';
import ReferralCampaign from '../models/Referral.model';
import asyncHandler from '../middleware/asyncHandler';
import ErrorResponse from '../utils/errorResponse';
import sendEmail from '../utils/sendEmail';
import sendSMS from '../utils/sendSMS';
import { AuthRequest, IUser } from '../types';

const sendTokenResponse = (user: IUser, statusCode: number, res: Response): void => {
  const token = user.getSignedJwtToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id, name: user.name, email: user.email, phone: user.phone,
      role: user.role, avatar: user.avatar,
      isEmailVerified: user.isEmailVerified, isPhoneVerified: user.isPhoneVerified,
      isSellerVerified: user.isSellerVerified, state: user.state, city: user.city,
    },
  });
};

export const register = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { name, email, phone, password, state, city, referralCode } = req.body as Record<string, string>;

  if (!email && !phone) return next(new ErrorResponse('Provide email or phone', 400));

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
      email: user.email as string,
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

  sendTokenResponse(user, 201, res);
});

export const login = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { email, phone, password } = req.body as Record<string, string>;
  if (!password || (!email && !phone)) return next(new ErrorResponse('Provide credentials', 400));

  const query = email ? { email } : { phone };
  const user = await User.findOne(query).select('+password');
  if (!user || !(await user.matchPassword(password))) return next(new ErrorResponse('Invalid credentials', 401));

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

export const logout = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, message: 'Logged out' });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id);
  res.status(200).json({ success: true, data: user });
});

export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ emailVerificationToken: hashedToken, emailVerificationExpire: { $gt: Date.now() } });
  if (!user) return next(new ErrorResponse('Invalid or expired token', 400));

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Email verified' });
});

export const verifyPhone = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = await User.findById(req.user!._id);
  if (!user || user.phoneOTP !== req.body.otp || (user.phoneOTPExpire && user.phoneOTPExpire < new Date())) {
    return next(new ErrorResponse('Invalid or expired OTP', 400));
  }
  user.isPhoneVerified = true;
  user.phoneOTP = undefined;
  user.phoneOTPExpire = undefined;
  await user.save();
  res.status(200).json({ success: true, message: 'Phone verified' });
});

export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new ErrorResponse('No user with that email', 404));
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  await sendEmail({
    email: user.email as string,
    subject: 'Shuk - Password Reset',
    template: 'passwordReset',
    data: { name: user.name, resetUrl: `${process.env.CLIENT_URL}/reset-password/${resetToken}` },
  });
  res.status(200).json({ success: true, message: 'Password reset email sent' });
});

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) return next(new ErrorResponse('Invalid or expired token', 400));
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendTokenResponse(user, 200, res);
});