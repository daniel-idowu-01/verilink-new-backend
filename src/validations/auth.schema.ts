import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email("Invalid email address"),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .optional(),
});

export const vendorRegisterSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email("Invalid email address"),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(8, "Password must be at least 8 characters"),
  businessName: z.string().min(1, "Business name is required"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .optional(),
  businessAddress: z.string().min(1, "Business Address is required"),
  businessType: z.string().min(1, "Business type is required"),
  taxId: z.string().min(1, "Tax ID is required").optional(),
});

export const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  verificationToken: z.string().min(1, "Verification code is required"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const requestPasswordResetSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email("Invalid email address"),
  resetToken: z.string().min(1, "Reset code is required"),
  newPassword: z
    .string({
      required_error: "Password is required",
    })
    .min(6, "Password must be at least 8 characters"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});
