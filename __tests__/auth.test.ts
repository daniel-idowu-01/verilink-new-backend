import request from "supertest";
import app from "../src/app";
import mongoose from "mongoose";
import { User } from "../src/models/User";

describe("Auth Routes", () => {
  let testUser: any;

  beforeAll(async () => {
    await mongoose.disconnect();
    await mongoose.connect("mongodb://localhost:27017/testdb");

    testUser = new User({
      email: "test@example.com",
      password: "Password123",
      firstName: "John",
      lastName: "Doe",
      isEmailVerified: true,
    });

    await testUser.save();
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
  });

  /* describe("POST login /login", () => {
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
  });

  describe("POST refreshToken /refresh-token", () => {
    it("should refresh token for valid refreshToken", async () => {
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: "Password123",
      });
      const accessToken = loginRes.body.data.accessToken;

      const cookies = loginRes.headers["set-cookie"];
      console.log("Cookies:", cookies);

      const res = await request(app)
        .get("/api/v1/auth/refresh-token")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies);

      console.log(123, res.body);

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });
  }); */
});
