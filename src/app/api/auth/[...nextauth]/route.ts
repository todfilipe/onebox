// Fica em src/lib/auth.ts para poder ser importado por Server Components/Actions sem arrastar o módulo de rota.
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
