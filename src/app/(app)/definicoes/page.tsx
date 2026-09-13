import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { getRules } from "@/lib/category-rules";
import { disconnectEmailAccount } from "@/lib/email-accounts";
import { supabaseAdmin } from "@/lib/supabase";
import { GlassCard } from "@/components/glass-card";
import { AddAccountModal } from "./add-account-modal";
import { DarkModeToggle } from "./dark-mode-toggle";
import { NewRuleButton } from "./new-rule-button";
import { RuleCard } from "./rule-card";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/");
  }

  const { data: accounts } = await supabaseAdmin
    .from("email_accounts")
    .select("id, email_gmail, watch_expiration")
    .eq("user_id", userId)
    .is("disconnected_at", null)
    .order("created_at");

  const rules = await getRules(userId);

  return (
    <div className="mx-auto w-full max-w-xl space-y-8">
      <h1 className="sr-only">Definições</h1>
      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Contas Gmail ligadas</h2>
          <AddAccountModal />
        </div>

        <ul className="mt-4 space-y-3">
          {(accounts ?? []).map((account) => {
            const isConnected =
              !!account.watch_expiration &&
              new Date(account.watch_expiration) > new Date();

            return (
              <li key={account.id}>
                <GlassCard className="flex items-center gap-3 p-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-hairline text-sm font-medium">
                    {account.email_gmail.charAt(0).toUpperCase()}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {account.email_gmail}
                    </p>
                    <span
                      className={`mt-0.5 flex items-center gap-1.5 text-xs ${
                        isConnected ? "text-positive" : "text-muted"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          isConnected ? "bg-positive" : "bg-muted"
                        }`}
                      />
                      {isConnected ? "Ligada" : "A sincronizar"}
                    </span>
                  </div>

                  <form
                    action={async () => {
                      "use server";
                      await disconnectEmailAccount(userId, account.id);
                      revalidatePath("/definicoes");
                    }}
                  >
                    <button
                      type="submit"
                      className="shrink-0 rounded-full border border-hairline px-4 py-1.5 text-xs font-medium transition-colors hover:bg-hairline"
                    >
                      Desligar
                    </button>
                  </form>
                </GlassCard>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Regras de categorização</h2>
          <NewRuleButton />
        </div>
        <p className="mt-1 text-xs text-muted">
          As regras aplicam-se a todas as contas ligadas
        </p>

        <ul className="mt-4 space-y-3">
          {rules.map((rule) => (
            <li key={rule.id}>
              <RuleCard rule={rule} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Preferências</h2>

        <GlassCard className="mt-4 flex items-center justify-between gap-4 p-4">
          <span className="text-sm font-medium">Modo escuro</span>
          <DarkModeToggle />
        </GlassCard>
      </section>

      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button
          type="submit"
          className="w-full rounded-full border border-hairline px-5 py-3 text-sm font-medium transition-colors hover:bg-hairline"
        >
          Terminar sessão
        </button>
      </form>
    </div>
  );
}
