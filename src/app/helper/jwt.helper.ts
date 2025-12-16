import httpStatus from "http-status";
import jwt, { Secret } from "jsonwebtoken";
import ApiError from "../errorHandlers/ApiError";

const createToken = (
  payload: Record<string, string | string[]>,
  secret: Secret,
  expiresIn: string
) => {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

const verifyToken = <T>(token: string, secret: Secret): T => {
  let payload;
  try {
    payload = jwt.verify(token, secret) as T;
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid signature");
  }
  return payload;
};

export const jwtHelper = {
  createToken,
  verifyToken,
};
