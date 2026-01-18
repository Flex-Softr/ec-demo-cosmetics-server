import crypto from "crypto";

/**
 * Normalize value before hashing (Meta requirement)
 */
const normalize = (value: string): string => {
  return value.trim().toLowerCase();
};

/**
 * SHA-256 hash (hex)
 */
export const hashUserData = (value?: string | null): string | undefined => {
  if (!value) return undefined;

  const normalized = normalize(value);

  return crypto.createHash("sha256").update(normalized).digest("hex");
};
