import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Schema, model } from "mongoose";
import { config } from "../config/config";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { IUser, UserRole, UserStatus } from "./interfaces/IUser";
import { auditableSchema, IAuditable } from "./base/AuditableModel";

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
    },
    avatar: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: "Avatar must be a valid image URL",
      },
    },
    roles: {
      type: [String],
      enum: Object.values(UserRole),
      default: [UserRole.CUSTOMER],
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING_VERIFICATION,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
    },
    ip: {
      type: String,
      // validate: {
      //   validator: function (v: string) {
      //     return (
      //       !v ||
      //       /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
      //         v
      //       )
      //     );
      //   },
      //   message: "IP address must be valid",
      // },
    },
    userAgent: {
      type: String,
      // validate: {
      //   validator: function (v: string) {
      //     return !v || v.length <= 255;
      //   },
      //   message: "User agent must be less than 255 characters",
      // },
    },

    // Security fields
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastVerificationEmailSent: {
      type: Date,
      default: null,
    },
    emailVerificationToken: {
      type: String,
      // select: false,
    },
    emailVerificationTokenExpiresAt: {
      type: Date,
      // select: false,
    },
    passwordResetToken: {
      type: String,
      // select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      // select: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    // Audit fields
    lastLoginAt: Date,
    lastLoginIP: String,
    failedLoginAttempts: [
      {
        ip: String,
        timestamp: { type: Date, default: Date.now },
        userAgent: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add auditable schema
userSchema.add(auditableSchema);

// Indexes for performance
// userSchema.index({ email: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ status: 1 });
userSchema.index({ vendorId: 1 });
userSchema.index({ isDeleted: 1, status: 1 });

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName || ""} ${this.lastName || ""}`.trim();
});

// Virtual for account lock status
userSchema.virtual("isAccountLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Pre-save middleware
userSchema.pre("save", async function (next) {
  // Hash password if modified
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, config.BCRYPT_ROUNDS);
    this.passwordChangedAt = new Date();
  }

  // Update status if email is verified
  if (this.isModified("isEmailVerified") && this.isEmailVerified) {
    this.status = UserStatus.ACTIVE;
  }

  next();
});

// Instance methods
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAccessToken = function (): string {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      roles: this.roles,
      vendorId: this.vendorId,
    },
    config.JWT_SECRET as Secret,
    { expiresIn: config.JWT_EXPIRES_IN } as SignOptions
  );
};

userSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign(
    { id: this._id },
    config.JWT_SECRET as Secret,
    {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN,
    } as SignOptions
  );
};

userSchema.methods.generateEmailVerificationToken = function (): string {
  const verificationToken = Math.floor(1000 + Math.random() * 9000).toString();
  // this.emailVerificationToken = crypto
  //   .createHash("sha256")
  //   .update(verificationToken)
  //   .digest("hex");
  this.emailVerificationToken = verificationToken;
  this.emailVerificationTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  return verificationToken;
};

userSchema.methods.generatePasswordResetToken = function (): string {
  const resetToken = Math.floor(1000 + Math.random() * 9000).toString();
  this.passwordResetToken = resetToken;
  this.passwordResetExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return resetToken;
};

userSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // Clear lock if it has expired
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates: {
    $inc: { loginAttempts: number };
    $set?: { lockUntil: Date };
  } = {
    $inc: { loginAttempts: 1 },
  };

  // Lock account after 5 failed attempts for 30 minutes
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + 30 * 60 * 1000) };
  }

  await this.updateOne(updates);
};

userSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

userSchema.methods.changedPasswordAfter = function (
  JWTTimestamp: number
): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

export const User = model<IUser>("User", userSchema);
