import { UserService } from "./UserService";
import { EmailService } from "./EmailService";

const userService = new UserService();
const emailService = new EmailService();

export { userService as UserService, emailService as EmailService };
