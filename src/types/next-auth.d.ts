import type { DefaultJWT } from "next-auth/jwt";

// Campo extra guardado no callback `jwt` de src/lib/auth.ts; opcional porque sessões antigas não o têm.
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    user_id?: string;
  }
}
