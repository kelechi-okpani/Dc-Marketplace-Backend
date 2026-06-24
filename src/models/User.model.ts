import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IUser } from '../types';

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    email: { type: String, unique: true, sparse: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
    phone: { type: String, unique: true, sparse: true },
    password: { type: String, minlength: 6, select: false },
    role: { type: String, enum: ['buyer','seller','moderator','category_manager','state_coordinator','admin','super_admin'], default: 'buyer' },
    avatar: { type: String, default: null },
    state: String, city: String, lga: String,
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isSellerVerified: { type: Boolean, default: false },
    verificationBadge: { type: String, enum: ['none','basic','premium'], default: 'none' },
    isDCMember: { type: Boolean, default: false },
    dcMemberVerified: { type: Boolean, default: false },
    dcState: String, dcChurch: String,
    dcConsentGiven: { type: Boolean, default: false },
    status: { type: String, enum: ['active','suspended','banned','pending'], default: 'active' },
    suspensionReason: String, suspendedAt: Date, suspendedUntil: Date,
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    referralSource: String,
    emailVerificationToken: String, emailVerificationExpire: Date,
    phoneOTP: String, phoneOTPExpire: Date,
    resetPasswordToken: String, resetPasswordExpire: Date,
    totalListings: { type: Number, default: 0 },
    activeListings: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
    isFlagged: { type: Boolean, default: false },
    lastLogin: Date, lastActive: Date,
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.getSignedJwtToken = function (): string {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET as any || '', {
    expiresIn: process.env.JWT_EXPIRE || '7d' as any,
  });
};

UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password as string);
};

UserSchema.methods.getEmailVerificationToken = function (): string {
  const token = crypto.randomBytes(20).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return token;
};

UserSchema.methods.generateOTP = function (): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.phoneOTP = otp;
  this.phoneOTPExpire = new Date(Date.now() + 10 * 60 * 1000);
  return otp;
};

UserSchema.methods.getResetPasswordToken = function (): string {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000);
  return resetToken;
};

export default mongoose.model<IUser>('User', UserSchema);