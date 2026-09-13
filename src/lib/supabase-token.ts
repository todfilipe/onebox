import { SignJWT } from "jose";

export function createRealtimeToken(userId: string) {
  const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);

  return new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setAudience("authenticated")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}
