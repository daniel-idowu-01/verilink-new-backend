import { Document, Types, Schema } from "mongoose";
import { IAuditable } from "../base/AuditableModel";

export enum UserRole {
  CUSTOMER = "customer",
  VENDOR = "vendor",
  ADMIN = "admin",
  MANAGER = "manager",
  SALES = "sales",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING_VERIFICATION = "pending_verification",
}

export interface IUser extends Document, IAuditable {
  _id: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  roles: UserRole[];
  status: UserStatus;
  vendorId?: Schema.Types.ObjectId;
  ip?: string;
  userAgent?: string;

  // Security fields
  loginAttempts: number;
  lockUntil?: Date;
  passwordChangedAt: Date;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;

  // Audit fields
  lastLoginAt?: Date;
  lastLoginIP?: string;
  failedLoginAttempts: Array<{
    ip: string;
    timestamp: Date;
    userAgent?: string;
  }>;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
  incrementLoginAttempts(): Promise<void>;
  isLocked(): boolean;
  changedPasswordAfter(JWTTimestamp: number): boolean;
}
