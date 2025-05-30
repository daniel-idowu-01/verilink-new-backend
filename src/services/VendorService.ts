import logger from "../utils/logger";
import { Vendor } from "../models/Vendor";
import { NotFoundError, BadRequestError } from "../utils/errors";

export class VendorService {
  async createVendor(vendorData: {
    userId: string;
    businessName: string;
    businessType: "individual" | "enterprise";
    registrationNumber: string;
    taxId?: string;
    businessAddress: string;
    contactPerson: string;
  }) {
    if (vendorData.businessType === "enterprise" && !vendorData.taxId) {
      throw new BadRequestError("Tax ID required for enterprises");
    }

    const vendor = new Vendor({
      ...vendorData,
      verificationStatus: "unverified",
      approved: false,
    });

    return vendor.save();
  }
}
