import { Request } from 'express';
import { Document, Types } from 'mongoose';

// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserRole =
  | 'buyer'
  | 'seller'
  | 'moderator'
  | 'category_manager'
  | 'state_coordinator'
  | 'admin'
  | 'super_admin';

export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending';
export type VerificationBadge = 'none' | 'basic' | 'premium';

export interface IUser extends Document {
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
  matchPassword(enteredPassword: string): Promise<boolean>;
  getEmailVerificationToken(): string;
  generateOTP(): string;
  getResetPasswordToken(): string;
}

// ─── Category ─────────────────────────────────────────────────────────────────

export type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date';

export interface IField {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  required: boolean;
  order: number;
}

export interface ICategory extends Document {
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
  customFields: IField[];
  prohibitedKeywords: string[];
  metaTitle?: string;
  metaDescription?: string;
  totalListings: number;
  activeListings: number;
}

// ─── Listing ──────────────────────────────────────────────────────────────────

export type ListingStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'paused'
  | 'sold'
  | 'expired'
  | 'rejected'
  | 'removed';

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type Condition = 'new' | 'used' | 'refurbished' | 'not_applicable';

export interface IListingImage {
  url: string;
  publicId: string;
  isPrimary: boolean;
}

export interface IListing extends Document {
  title: string;
  description: string;
  price?: number;
  priceNegotiable: boolean;
  priceLabel?: string;
  currency: string;
  category: Types.ObjectId;
  subcategory?: Types.ObjectId;
  seller: Types.ObjectId;
  images: IListingImage[];
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
  availableUntil?: Date;
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
  renewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface IConversation extends Document {
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

export type MessageType = 'text' | 'image' | 'offer' | 'system';

export interface IMessage extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  messageType: MessageType;
  imageUrl?: string;
  readBy: Array<{ user: Types.ObjectId; readAt: Date }>;
  isDeleted: boolean;
  deletedAt?: Date;
  isReported: boolean;
  reportedAt?: Date;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export type PaymentType = 'boost' | 'featured' | 'seller_plan' | 'verification' | 'category_sponsor';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';
export type PaymentGateway = 'paystack' | 'flutterwave';

export interface IPayment extends Document {
  user: Types.ObjectId;
  listing?: Types.ObjectId;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gateway?: PaymentGateway;
  gatewayReference?: string;
  gatewayResponse?: Record<string, unknown>;
  paidAt?: Date;
  refundedAt?: Date;
  refundReason?: string;
  metadata?: Record<string, unknown>;
}

// ─── Promotion ────────────────────────────────────────────────────────────────

export type PromotionType = 'boost' | 'featured' | 'category_top' | 'homepage_banner';

export interface IPromotionPackage extends Document {
  name: string;
  type: PromotionType;
  durationDays: number;
  price: number;
  description?: string;
  isActive: boolean;
  priority: number;
  maxPerCategory?: number;
  applicableCategories: Types.ObjectId[];
}

export interface IActivePromotion extends Document {
  listing: Types.ObjectId;
  seller: Types.ObjectId;
  package: Types.ObjectId;
  payment: Types.ObjectId;
  type: PromotionType;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  impressions: number;
  clicks: number;
}

// ─── Report ───────────────────────────────────────────────────────────────────

export type ReportReason =
  | 'scam_or_fraud'
  | 'fake_listing'
  | 'prohibited_item'
  | 'wrong_category'
  | 'spam'
  | 'offensive_content'
  | 'counterfeit'
  | 'harassment'
  | 'other';

export type ReportStatus =
  | 'open'
  | 'under_review'
  | 'resolved_action_taken'
  | 'resolved_no_action'
  | 'dismissed';

export type ReportPriority = 'low' | 'medium' | 'high' | 'critical';
export type ReportTargetType = 'listing' | 'user' | 'message';
export type ReportAction =
  | 'none'
  | 'listing_removed'
  | 'listing_hidden'
  | 'user_warned'
  | 'user_suspended'
  | 'user_banned';

export interface IReport extends Document {
  reporter: Types.ObjectId;
  targetType: ReportTargetType;
  targetListing?: Types.ObjectId;
  targetUser?: Types.ObjectId;
  targetMessage?: Types.ObjectId;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  assignedTo?: Types.ObjectId;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  resolutionNote?: string;
  actionTaken?: ReportAction;
  priority: ReportPriority;
}

// ─── Review ───────────────────────────────────────────────────────────────────

export type ReviewType = 'buyer_to_seller' | 'seller_to_buyer';

export interface IReview extends Document {
  reviewer: Types.ObjectId;
  reviewee: Types.ObjectId;
  listing?: Types.ObjectId;
  rating: number;
  comment?: string;
  type: ReviewType;
  isVisible: boolean;
}

// ─── Referral ─────────────────────────────────────────────────────────────────

export type ReferralType = 'state' | 'church' | 'department' | 'campaign' | 'general';

export interface IReferralCampaign extends Document {
  name: string;
  code: string;
  type: ReferralType;
  stateCode?: string;
  churchName?: string;
  coordinatorName?: string;
  coordinatorUser?: Types.ObjectId;
  isActive: boolean;
  expiresAt?: Date;
  totalClicks: number;
  totalRegistrations: number;
  totalListings: number;
  totalSellers: number;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType =
  | 'new_message'
  | 'listing_approved'
  | 'listing_rejected'
  | 'listing_expiring'
  | 'boost_expired'
  | 'new_review'
  | 'account_warning'
  | 'account_suspended'
  | 'report_resolved'
  | 'verification_approved'
  | 'verification_rejected'
  | 'system';

export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  channel: NotificationChannel;
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

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
  userAgent?: string;
}

// ─── Express Extensions ───────────────────────────────────────────────────────

export interface AuthRequest extends Request {
  user?: IUser;
}

// ─── Email ────────────────────────────────────────────────────────────────────

export interface SendEmailOptions {
  email: string;
  subject: string;
  template?: string;
  data?: Record<string, string>;
  html?: string;
  text?: string;
}