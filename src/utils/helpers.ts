import { Response } from "express";
import { AuthTokens } from "../controllers/AuthController";

export const setSecureCookies = (res: Response, tokens: AuthTokens) => {
  res.cookie("accessToken", tokens.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    domain: process.env.COOKIE_DOMAIN,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    domain: process.env.COOKIE_DOMAIN,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const validateCACNumber = (value: string) => {
  if (!/^RC\d{8}$/.test(value)) {
    throw new Error("Invalid CAC format. Use RC followed by 8 digits");
  }
  return true;
};
