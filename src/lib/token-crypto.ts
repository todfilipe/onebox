import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function encryptionKey() {
  return Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, "base64");
}

// Formato guardado: iv (12 bytes) · auth tag (16 bytes) · ciphertext, tudo num único base64.
export function encryptToken(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
    "base64",
  );
}

export function decryptToken(encrypted: string) {
  const raw = Buffer.from(encrypted, "base64");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    raw.subarray(0, 12),
  );
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([
    decipher.update(raw.subarray(28)),
    decipher.final(),
  ]).toString("utf8");
}
