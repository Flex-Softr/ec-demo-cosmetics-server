import { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";

const limitRequest = (
  windowMs: number = 10,
  maxRequest: number = 5,
  message: string = "Too many attempts"
) => {
  const limiter = rateLimit({
    windowMs: windowMs * 60 * 1000,
    max: maxRequest,
    message: {
      success: false,
      message,
      errorMessages: [
        {
          path: "",
          message,
        },
      ],
    },
    skip: (req) => req.originalUrl.includes("/uploads/"),
  });

  return (req: Request, res: Response, next: NextFunction) =>
    limiter(req, res, next);
};

export default limitRequest;
