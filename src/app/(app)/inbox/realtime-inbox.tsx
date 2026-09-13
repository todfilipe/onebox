"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export function RealtimeInbox({
  supabaseUrl,
  anonKey,
}: {
  supabaseUrl: string;
  anonKey: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      accessToken: async () => {
        const response = await fetch("/api/realtime-token");
        const { token } = await response.json();
        return token;
      },
    });

    const channel = supabase
      .channel("inbox")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emails" },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, supabaseUrl, anonKey]);

  return null;
}
