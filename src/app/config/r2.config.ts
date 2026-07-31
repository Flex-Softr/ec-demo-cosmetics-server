import { S3Client } from "@aws-sdk/client-s3";
import config from "./config";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
  // R2 rejects the SDK's default CRC32 checksum headers on presigned PUTs
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: config.r2.accessKeyId as string,
    secretAccessKey: config.r2.secretAccessKey as string,
  },
});
