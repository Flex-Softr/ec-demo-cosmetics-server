/* eslint-disable no-undef */
import crypto from "crypto";
import config from "../config/config";

const ALGO = "aes-256-gcm"; // modern AES
const ENC_KEY = crypto
  .createHash("sha256")
  .update(config?.session_secret ?? "")
  .digest();
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, ENC_KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decrypt(enc: string): string {
  if (!enc) throw new Error("Encrypted string is empty!");

  const data = Buffer.from(enc, "base64");
  if (data.length < IV_LENGTH + 16) {
    throw new Error("Encrypted data is too short!");
  }

  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + 16);
  const text = data.subarray(IV_LENGTH + 16);

  const decipher = crypto.createDecipheriv(ALGO, ENC_KEY, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(text), decipher.final()]);
  return decrypted.toString("utf8");
}
