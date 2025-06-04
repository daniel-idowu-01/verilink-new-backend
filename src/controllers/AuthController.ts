import jwt from "jsonwebtoken";
import logger from "../utils/logger";
import { config } from "../config/config";
import { setSecureCookies } from "../utils/helpers";
import { ApiResponse } from "../middlewares/responseHandler";
import { UserService, EmailService, VendorService } from "../services";
import { Request, Response, NextFunction, RequestHandler } from "express";
import {
  ValidationError,
  ConflictError,
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  InternalServerError,
} from "../utils/errors";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthController {
  ////////////////////////////////////
  // register controller
  ////////////////////////////////////
  registerUser: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      logger.info("Registering user with email: " + req.body.email);
      const { email, password, firstName, lastName, phone } = req.body;
      const ip = req.ip || "unknown";
      const userAgent = req.get("User-Agent");

      const user = await UserService.getUserByEmail(email, true);

      if (user) {
        throw new ConflictError("User already exists");
      }

      const newUser = await UserService.createUser({
        email,
        password,
        firstName,
        lastName,
        phone,
        ip,
        userAgent,
      });

      if (!newUser) {
        throw new InternalServerError("User registration failed");
      }

      const verificationToken = newUser.generateEmailVerificationToken();
      if (config.NODE_ENV !== "production") {
        logger.info(`Verification token for ${email}: ${verificationToken}`);
      }
      newUser.lastVerificationEmailSent = new Date();
      await newUser.save();

      if (config.NODE_ENV === "production") {
        await EmailService.sendEmail({
          from: '"Verilink" <no-reply@verilink.com>',
          to: email,
          subject: "Your Email Verification Code",
          html: `
                    <p>Hello ${firstName},</p>
                    <p>Your email verification code is: <strong>${verificationToken}</strong></p>
                    <p>This code will expire in 10 minutes.</p>
                `,
        });
      }

      ApiResponse.created(
        res,
        {
          user: {
            id: newUser._id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            phone: newUser.phone,
          },
        },
        "User registered successfully. Please check your email for verification."
      );
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // register vendor controller
  ////////////////////////////////////
  registerVendor: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        email,
        password,
        businessName,
        businessType,
        phone,
        ...vendorData
      } = req.body;
      const ip = req.ip || "unknown";
      const userAgent = req.get("User-Agent") || "";

      const existingUser = await UserService.getUserByEmail(email, true);
      if (existingUser) {
        throw new ConflictError("Email already registered");
      }

      const user = await UserService.createUser({
        email,
        password,
        phone,
        roles: ["vendor"],
        ip,
        userAgent,
      });

      const vendor = await VendorService.createVendor({
        userId: user._id,
        businessName,
        businessType,
        registrationNumber: vendorData.registrationNumber,
        taxId: vendorData.taxId,
        businessAddress: vendorData.businessAddress,
        contactPerson: `${user.firstName} ${user.lastName}`,
      });

      // Initiate KYC
      // await KYCService.initiateVerification({
      //   userId: user._id,
      //   businessRegistrationNumber: vendor.registrationNumber,
      //   taxId: vendor.taxId
      // });

      // Send verification email
      const verificationToken = user.generateEmailVerificationToken();
      await EmailService.sendVendorWelcomeEmail({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        businessName: vendor.businessName,
        verificationToken,
        kycRequirements: ["CAC certificate", "Tax clearance", "Valid ID"],
      });

      ApiResponse.created(
        res,
        {
          user: {
            id: user._id,
            email: user.email,
            roles: user.roles,
          },
          vendor: {
            id: vendor._id,
            businessName: vendor.businessName,
            status: vendor.verificationStatus,
          },
        },
        "Vendor registration successful - check email for next steps"
      );
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // login controller
  ////////////////////////////////////
  login: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      logger.info("Logging in user with email: " + req.body.email);
      const { email, password } = req.body;
      const ip = req.ip || "unknown";
      const userAgent = req.get("User-Agent");

      const user = await UserService.getUserByEmail(email, false);

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        await user.incrementLoginAttempts();
        throw new UnauthorizedError("Invalid credentials");
      }

      if (!user.isEmailVerified) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        if (
          user.lastVerificationEmailSent &&
          user.lastVerificationEmailSent > oneHourAgo
        ) {
          throw new ConflictError(
            "Verification code was already sent recently. Please check your email or wait before requesting another."
          );
        }

        const verificationToken = user.generateEmailVerificationToken();
        if (config.NODE_ENV !== "production") {
          logger.info(`Verification token for ${email}: ${verificationToken}`);
        }
        user.lastVerificationEmailSent = new Date();
        await user.save();

        if (config.NODE_ENV === "production") {
          await EmailService.sendEmail({
            from: '"Verilink" <no-reply@verilink.com>',
            to: email,
            subject: "Your Email Verification Code",
            html: `
                    <p>Hello ${user.firstName},</p>
                    <p>Your email verification code is: <strong>${user.emailVerificationToken}</strong></p>
                    <p>This code will expire in 10 minutes.</p>
                `,
          });
        }

        throw new ConflictError(
          "Email not verified. Please check your email for the verification code."
        );
      }

      const tokens: AuthTokens = {
        accessToken: user.generateAccessToken(),
        refreshToken: user.generateRefreshToken(),
      };

      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();

      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      ApiResponse.success(
        res,
        {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles,
            status: user.status,
            vendorId: user.vendorId,
          },
          accessToken: tokens.accessToken,
        },
        "Login successful"
      );
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // verify email controller
  ////////////////////////////////////
  verifyEmail: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email, verificationToken } = req.body;

      const user = await UserService.getUserByEmail(email, true);
      if (!user) throw new NotFoundError("User not found");

      if (user.isEmailVerified) {
        return ApiResponse.success(res, null, "Email already verified");
      }

      const now = new Date();

      if (
        !user.emailVerificationToken ||
        user.emailVerificationToken !== verificationToken ||
        !user.emailVerificationTokenExpiresAt ||
        user.emailVerificationTokenExpiresAt < now
      ) {
        throw new BadRequestError("Invalid or expired verification token");
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationTokenExpiresAt = undefined;
      await user.save();

      ApiResponse.success(res, null, "Email verified successfully");
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // logout controller
  ////////////////////////////////////
  logout: RequestHandler = (
    req: Request & { user?: { id: string } },
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not authenticated");
      }
      logger.info("Logging out user with ID: " + req.user.id);
      res.clearCookie("accessToken");
      ApiResponse.success(res, null, "Logout successful");
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // refresh token controller
  ////////////////////////////////////
  refreshToken: RequestHandler = async (
    req: Request & { user?: { id: string } },
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not authenticated");
      }

      logger.info("Refreshing token for user with ID: " + req.user?.id);
      const user = await UserService.getUserById(req.user?.id);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      const tokens: AuthTokens = {
        accessToken: user.generateAccessToken(),
        refreshToken: user.generateRefreshToken(),
      };

      setSecureCookies(res, tokens);

      ApiResponse.success(
        res,
        { accessToken: tokens.accessToken },
        "Token refreshed successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // request password reset controller
  ////////////////////////////////////
  requestPasswordReset: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email } = req.body;
      logger.info("Requesting password reset for email: " + email);

      const user = await UserService.getUserByEmail(email, false);
      if (!user || !user.isEmailVerified) {
        throw new NotFoundError(
          `User not ${user.isEmailVerified ? "found" : "verified"}`
        );
      }

      const resetToken = user.generatePasswordResetToken();
      await user.save();

      if (config.NODE_ENV === "production") {
        await EmailService.sendEmail({
          from: '"Verilink" <info@verilink.com>',
          to: email,
          subject: "Password Reset Request",
          html: `
                    <p>Hello ${user.firstName},</p>
                    <p>We received a request to reset your password. Use the following token:</p>
                    <p><strong>${resetToken}</strong></p>
                    <p>This token will expire in 10 minutes.</p>
                `,
        });
      }

      ApiResponse.success(res, null, "Password reset token sent to your email");
    } catch (error) {
      next(error);
    }
  };

  ////////////////////////////////////
  // reset password controller
  ////////////////////////////////////
  resetPassword: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email, resetToken, newPassword } = req.body;
      logger.info("Resetting password for email: " + email);

      const user = await UserService.getUserByEmail(email, false);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      const now = new Date();

      if (
        !user.passwordResetToken ||
        user.passwordResetToken !== resetToken ||
        !user.passwordResetExpiresAt ||
        user.passwordResetExpiresAt < now
      ) {
        throw new BadRequestError("Invalid or expired password reset token");
      }

      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();

      ApiResponse.success(res, null, "Password reset successfully");
    } catch (error) {
      next(error);
    }
  };
}
