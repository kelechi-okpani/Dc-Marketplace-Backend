import { Request } from 'express';
import { Document, Types } from 'mongoose';

export type UserRole =
  | 'buyer' | 'seller' | 'moderator'
  | 'category_manager' | 'state_coordinator'
  | 'admin' | 'super_admin';

export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending';
export type VerificationBadge = 'none' | 'basic' | 'premium';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  state?: string;
  city?: string;
  lga?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isSellerVerified: boolean;
  verificationBadge: VerificationBadge;
  isDCMember: boolean;
  dcMemberVerified: boolean;
  dcState?: string;
  dcChurch?: string;
  dcConsentGiven: boolean;
  status: UserStatus;
  suspensionReason?: string;
  suspendedAt?: Date;
  suspendedUntil?: Date;
  referralCode?: string;
  referredBy?: Types.ObjectId;
  referralSource?: string;
  emailVerificationToken?: string;
  emailVerificationExpire?: Date;
  phoneOTP?: string;
  phoneOTPExpire?: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  totalListings: number;
  activeListings: number;
  reportCount: number;
  isFlagged: boolean;
  lastLogin?: Date;
  lastActive?: Date;
  createdAt: Date;
  updatedAt: Date;
  getSignedJwtToken(): string;
  matchPassword(entered: string): Promise<boolean>;
  getEmailVerificationToken(): string;
  generateOTP(): string;
  getResetPasswordToken(): string;
}

export type ListingStatus =
  | 'draft' | 'pending_review' | 'active'
  | 'paused' | 'sold' | 'expired' | 'rejected' | 'removed';

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type Condition = 'new' | 'used' | 'refurbished' | 'not_applicable';

export interface IListing extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  price?: number;
  priceNegotiable: boolean;
  priceLabel?: string;
  currency: string;
  category: Types.ObjectId;
  subcategory?: Types.ObjectId;
  seller: Types.ObjectId;
  images: Array<{ url: string; publicId: string; isPrimary: boolean }>;
  state: string;
  city?: string;
  lga?: string;
  address?: string;
  coordinates: { type: string; coordinates: [number, number] };
  condition?: Condition;
  customFields: Map<string, unknown>;
  status: ListingStatus;
  rejectionReason?: string;
  moderationStatus: ModerationStatus;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  moderationNote?: string;
  isSold: boolean;
  soldAt?: Date;
  isFeatured: boolean;
  isBoosted: boolean;
  featuredUntil?: Date;
  boostedUntil?: Date;
  boostPriority: number;
  views: number;
  saves: number;
  chatCount: number;
  reportCount: number;
  isFlagged: boolean;
  tags: string[];
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  parent?: Types.ObjectId;
  isActive: boolean;
  order: number;
  isHighRisk: boolean;
  requiresAdminReview: boolean;
  customFields: Array<{
    name: string; label: string;
    type: string; options?: string[];
    required: boolean; order: number;
  }>;
  prohibitedKeywords: string[];
  totalListings: number;
  activeListings: number;
}

export interface IConversation extends Document {
  _id: Types.ObjectId;
  listing: Types.ObjectId;
  buyer: Types.ObjectId;
  seller: Types.ObjectId;
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  unreadCount: Map<string, number>;
  blockedBy?: Types.ObjectId;
  isBlocked: boolean;
  archivedBy: Types.ObjectId[];
  isActive: boolean;
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  messageType: 'text' | 'image' | 'offer' | 'system';
  imageUrl?: string;
  readBy: Array<{ user: Types.ObjectId; readAt: Date }>;
  isDeleted: boolean;
  isReported: boolean;
  createdAt: Date;
}

export interface IPayment extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  listing?: Types.ObjectId;
  type: 'boost' | 'featured' | 'seller_plan' | 'verification' | 'category_sponsor';
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  gateway?: 'paystack' | 'flutterwave';
  gatewayReference?: string;
  gatewayResponse?: Record<string, unknown>;
  paidAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface IPromotionPackage extends Document {
  _id: Types.ObjectId;
  name: string;
  type: 'boost' | 'featured' | 'category_top' | 'homepage_banner';
  durationDays: number;
  price: number;
  description?: string;
  isActive: boolean;
  priority: number;
}

export interface IActivePromotion extends Document {
  _id: Types.ObjectId;
  listing: Types.ObjectId;
  seller: Types.ObjectId;
  package: Types.ObjectId;
  payment: Types.ObjectId;
  type: string;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  impressions: number;
  clicks: number;
}

export interface IReport extends Document {
  _id: Types.ObjectId;
  reporter: Types.ObjectId;
  targetType: 'listing' | 'user' | 'message';
  targetListing?: Types.ObjectId;
  targetUser?: Types.ObjectId;
  reason: string;
  description?: string;
  status: string;
  assignedTo?: Types.ObjectId;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  resolutionNote?: string;
  actionTaken?: string;
  priority: string;
}

export interface IReview extends Document {
  _id: Types.ObjectId;
  reviewer: Types.ObjectId;
  reviewee: Types.ObjectId;
  listing?: Types.ObjectId;
  rating: number;
  comment?: string;
  type: 'buyer_to_seller' | 'seller_to_buyer';
  isVisible: boolean;
}

export interface IReferralCampaign extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  type: string;
  stateCode?: string;
  churchName?: string;
  coordinatorName?: string;
  isActive: boolean;
  totalClicks: number;
  totalRegistrations: number;
  totalListings: number;
  totalSellers: number;
}

export interface INotification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  channel: string;
  createdAt: Date;
}

export interface ISavedListing extends Document {
  user: Types.ObjectId;
  listing: Types.ObjectId;
}

export interface IAuditLog extends Document {
  actor: Types.ObjectId;
  action: string;
  targetType?: string;
  targetId?: Types.ObjectId;
  details?: Record<string, unknown>;
  ip?: string;
}

// GraphQL Context
export interface GraphQLContext {
  user?: IUser;
  req: Request;
}

export interface SendEmailOptions {
  email: string;
  subject: string;
  template?: string;
  data?: Record<string, string>;
  html?: string;
}