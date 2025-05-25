import { Schema, model } from "mongoose";
import { IVendor, BusinessType } from "./interfaces/IVendor";

const vendorSchema = new Schema<IVendor>(
  {
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    businessType: {
      type: String,
      enum: Object.values(BusinessType),
      required: true,
    },
    businessRegistrationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    taxIdentificationNumber: {
      type: String,
    },
    businessAddress: {
      type: String,
      required: true,
    },
    contactPerson: {
      type: String,
      required: true,
    },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: true,
    },
    website: {
      type: String,
    },
    logoUrl: {
      type: String,
    },
    description: {
      type: String,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    kycDocuments: [
      {
        documentType: { type: String, required: true },
        documentUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    stores: [
      {
        type: Schema.Types.ObjectId,
        ref: "Store",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add index for frequently queried fields
vendorSchema.index({ businessName: "text", contactEmail: 1 });

export const Vendor = model<IVendor>("Vendor", vendorSchema);
