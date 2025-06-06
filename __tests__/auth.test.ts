import app from "../src/app";
import request from "supertest";
import mongoose from "mongoose";
import { User } from "../src/models/User";

describe("Auth Routes", () => {
  let testUser: any, accessToken: string;

  beforeAll(async () => {
    await mongoose.disconnect();
    await mongoose.connect("mongodb://localhost:27017/testdb");

    testUser = new User({
      email: "test@example.com",
      password: "Password123",
      firstName: "John",
      lastName: "Doe",
      isEmailVerified: true,
      emailVerificationToken: "1234",
    });
    await testUser.save();

    const resetPasswordUser = new User({
      email: "mike@example.com",
      password: "Password123",
      firstName: "John",
      lastName: "Doe",
      isEmailVerified: true,
      passwordResetToken: "1234",
      passwordResetExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await resetPasswordUser.save();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  describe("POST registerUser /register", () => {
    it("should create a new user", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "daniel@gmail.com",
        password: "Password123",
        firstName: "Daniel",
        lastName: "Smith",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe("daniel@gmail.com");
      expect(res.body.data.user.firstName).toBe("Daniel");
      expect(res.body.data.user.lastName).toBe("Smith");
    });

    it("should throw ConflictError if email exists", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "test@example.com",
        password: "Password123",
        firstName: "Daniel",
        lastName: "Smith",
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/User already exists/i);
    });

    it("should throw ValidationError if user input validation fails", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "test@example.com",
        firstName: "Daniel",
        lastName: "Smith",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Validation failed/i);
      expect(res.body.errors[0].message).toBe("Password is required");
    });

    it("should throw InternalServerError if db registration fails", async () => {
      jest.spyOn(User, "create").mockRejectedValue(new Error("Database error"));

      const res = await request(app).post("/api/v1/auth/register").send({
        email: "newuser@example.com",
        password: "P@ssw0rd",
        firstName: "Daniel",
        lastName: "Smith",
      });

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Internal server error/i);
    });
  });

  describe("POST login /login", () => {
    it("should login a user with correct credentials", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: "Password123",
      });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe("test@example.com");
    });

    it("should fail with incorrect password", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: "WrongPassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Invalid credentials/i);
    });

    it("should fail with unverified email (with recent verification code)", async () => {
      const newUser = new User({
        email: "newUser@example.com",
        password: "Password123",
        firstName: "John",
        lastName: "Doe",
        lastVerificationEmailSent: new Date(),
      });
      await newUser.save();

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "newUser@example.com",
        password: "Password123",
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(
        /Verification code was already sent recently. Please check your email or wait before requesting another./i
      );
    });

    it("should fail with unverified email (with outdated verification code)", async () => {
      const newUser = new User({
        email: "updatedUser@example.com",
        password: "Password123",
        firstName: "John",
        lastName: "Doe",
      });
      await newUser.save();

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "updatedUser@example.com",
        password: "Password123",
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(
        /Email not verified. Please check your email for the verification code./i
      );
    });
  });

  describe("GET verifyEmail /verify-email", () => {
    it("should verify user with correct credentials", async () => {
      const newUser = new User({
        email: "dee@example.com",
        password: "Password123",
        firstName: "John",
        lastName: "Doe",
        emailVerificationToken: "7890",
        emailVerificationTokenExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
      await newUser.save();

      const res = await request(app).post("/api/v1/auth/verify-email").send({
        email: "dee@example.com",
        verificationToken: "7890",
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/Email verified successfully/i);
    });

    it("should fail if user is already verified", async () => {
      const res = await request(app).post("/api/v1/auth/verify-email").send({
        email: "test@example.com",
        verificationToken: "1234",
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/Email already verified/i);
    });

    it("should fail if verification code is wrong", async () => {
      const newUser = new User({
        email: "dee2@example.com",
        password: "Password123",
        firstName: "John",
        lastName: "Doe",
        emailVerificationToken: "7890",
        emailVerificationTokenExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
      await newUser.save();

      const res = await request(app).post("/api/v1/auth/verify-email").send({
        email: "dee2@example.com",
        verificationToken: "5678",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(
        /Invalid or expired verification token/i
      );
    });
  });

  describe("POST refreshToken /refresh-token", () => {
    it("should refresh token for valid refreshToken", async () => {
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: "Password123",
      });

      const cookies = loginRes.headers["set-cookie"];

      const res = await request(app)
        .get("/api/v1/auth/refresh-token")
        .set("Cookie", cookies);

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it("should fail if refresh token is not provided", async () => {
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: "Password123",
      });
      const accessToken = loginRes.body.data.accessToken;

      const res = await request(app)
        .get("/api/v1/auth/refresh-token")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Refresh token required/i);
    });
  });

  describe("POST requestPasswordReset /request-password-reset", () => {
    it("should request password reset for existing user", async () => {
      const res = await request(app)
        .post("/api/v1/auth/request-password-reset")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(
        /Password reset token sent to your email/i
      );
    });

    it("should fail if user does not exist", async () => {
      const res = await request(app)
        .post("/api/v1/auth/request-password-reset")
        .send({ email: "nouser@gmail.com" });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/User not found/i);
    });

    it("should fail if email is not provided", async () => {
      const res = await request(app)
        .post("/api/v1/auth/request-password-reset")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toMatch(/Email is required/i);
    });

    it("should fail if email format is invalid", async () => {
      const res = await request(app)
        .post("/api/v1/auth/request-password-reset")
        .send({ email: "invalid-email" });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toMatch(/Invalid email address/i);
    });
  });

  describe("POST resetPassword /reset-password", () => {
    it("should reset password for existing user", async () => {
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: "mike@example.com",
        password: "Password123",
      });

      accessToken = loginRes.body.data.accessToken;
      const res = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          email: "mike@example.com",
          resetToken: "1234",
          newPassword: "NewPassword123",
        })
        .set("Cookie", accessToken);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/Password reset successfully/i);
    });

    it("should fail if verification token is invalid", async () => {
      const res = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          email: "mike@example.com",
          resetToken: "wrong-token",
          newPassword: "NewPassword123",
        })
        .set("Cookie", accessToken);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(
        /Invalid or expired password reset token/i
      );
    });

    it("should fail if new password is not provided", async () => {
      const res = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          email: "mike@example.com",
          resetToken: "1234",
        })
        .set("Cookie", accessToken);

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toMatch(/Password is required/i);
    });
  });
});
