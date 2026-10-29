import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE_NAME = "tinnah-admin-session";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME?.trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim();
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET?.trim();

export function getAdminCredentials() {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    throw new Error("Admin credentials are not configured.");
  }

  return {
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
  };
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf-8");
}

export function createAdminSessionToken() {
  if (!ADMIN_USERNAME || !ADMIN_SESSION_SECRET) {
    throw new Error("Admin session secret is not configured.");
  }

  const payload = JSON.stringify({
    user: ADMIN_USERNAME,
    exp: Date.now() + 1000 * 60 * 60 * 8,
  });

  const encodedPayload = encodeBase64Url(payload);
  const signature = createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(token: string) {
  if (!ADMIN_SESSION_SECRET) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [payloadBase64, providedSignature] = parts;
  const expectedSignature = createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length) {
    return false;
  }

  if (!timingSafeEqual(provided, expected)) {
    return false;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(payloadBase64)) as { user?: string; exp?: number };
    if (!payload.user || payload.user !== ADMIN_USERNAME) {
      return false;
    }

    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return Boolean(token && verifyAdminSessionToken(token));
}
