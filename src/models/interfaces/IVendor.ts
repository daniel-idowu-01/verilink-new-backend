import { Document, Types } from "mongoose";

export enum BusinessType {
  RETAIL = "retail",
  WHOLESALE = "wholesale",
  MANUFACTURER = "manufacturer",
  SERVICE = "service",
}

export interface IVendor extends Document {
  businessName: string;
  businessType: BusinessType;
  businessRegistrationNumber: string;
  taxIdentificationNumber?: string;
  businessAddress: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  logoUrl?: string;
  description?: string;
  userId: Types.ObjectId;
  isVerified: boolean;
  verificationStatus: "pending" | "verified" | "rejected";
  kycDocuments: {
    documentType: string;
    documentUrl: string;
    uploadedAt: Date;
  }[];
  stores: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
