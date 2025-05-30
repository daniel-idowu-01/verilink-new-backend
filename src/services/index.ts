import { UserService } from "./UserService";
import { EmailService } from "./EmailService";
import { VendorService } from "./VendorService";
import { KYCService } from "./KycService";

const userService = new UserService();
const emailService = new EmailService();
const vendorService = new VendorService();
const kycService = new KYCService();

export {
  userService as UserService,
  emailService as EmailService,
  vendorService as VendorService,
  kycService as KYCService,
};
