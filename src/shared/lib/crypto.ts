import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Streaming account passwords must be readable again (they are handed to
// clients), so they are encrypted with AES-256-GCM instead of hashed.
const PREFIX = "enc:v1:";

function getKey() {
  const key = process.env.ACCOUNT_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ACCOUNT_ENCRYPTION_KEY is not set");
  }

  const buffer = Buffer.from(key, "base64");
  if (buffer.length !== 32) {
    throw new Error("ACCOUNT_ENCRYPTION_KEY must be 32 bytes encoded in base64");
  }

  return buffer;
}

export function encryptSecret(plainText: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(value: string) {
  // Rows saved before encryption was introduced are still plain text
  if (!value.startsWith(PREFIX)) {
    return value;
  }

  const [iv, tag, encrypted] = value.slice(PREFIX.length).split(":");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
