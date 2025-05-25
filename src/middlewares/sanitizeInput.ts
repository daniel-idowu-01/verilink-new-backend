import { Request, Response, NextFunction } from "express";

export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  for (const key in req.body) {
    if (typeof req.body[key] === "string") {
      req.body[key] = req.body[key].replace(/\$/g, "");
    }
  }
  next();
};
