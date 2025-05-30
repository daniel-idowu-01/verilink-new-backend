import axios from "axios";
import { Vendor } from "../models/Vendor";
import { BadRequestError } from "../utils/errors";

export class KYCService {
  static async initiateVerification(params: {
    userId: string;
    businessRegistrationNumber: string;
    taxId?: string;
  }) {
    const verificationPayload = {
      businessRegistrationNumber: params.businessRegistrationNumber,
      taxId: params.taxId,
      country: "NG",
    };

    const cacResponse = await axios.post(
      "https://api.cac.gov.ng/verify",
      verificationPayload
    );

    if (!cacResponse.data.verified) {
      throw new BadRequestError("Business registration verification failed");
    }

    await Vendor.updateOne(
      { userId: params.userId },
      { $set: { verificationStatus: "pending_documents" } }
    );
  }
}
