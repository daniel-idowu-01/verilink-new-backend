import logger from "../utils/logger";
import { Vendor } from "../models/Vendor";
import { NotFoundError, BadRequestError } from "../utils/errors";

export class VendorService {
  async createVendor(vendorData: {
    userId: string;
    businessName: string;
    businessType: string; //"individual" | "enterprise";
    businessRegistrationNumber: string;
    taxIdentificationNumber?: string;
    businessAddress: string;
  }) {
    if (
      vendorData.businessType === "enterprise" &&
      !vendorData.taxIdentificationNumber
    ) {
      throw new BadRequestError("Tax ID required for enterprises");
    }

    const vendor = new Vendor({
      ...vendorData,
      approved: false,
    });

    return vendor.save();
  }
}
