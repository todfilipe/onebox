import { localSupabaseEnv } from "./scripts/local-supabase.mjs";

Object.assign(process.env, localSupabaseEnv());
