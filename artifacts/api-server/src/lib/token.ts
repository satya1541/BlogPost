import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET || "dev-fallback-secret";

export function signToken(payload: string): string {
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(payload);
  const signature = hmac.digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expectedSignature = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  if (signature === expectedSignature) return payload;
  return null;
}
