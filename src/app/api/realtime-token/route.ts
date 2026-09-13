import { auth } from "@/lib/auth";
import { createRealtimeToken } from "@/lib/supabase-token";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response("Sem sessão", { status: 401 });
  }

  return Response.json({ token: await createRealtimeToken(session.user.id) });
}
