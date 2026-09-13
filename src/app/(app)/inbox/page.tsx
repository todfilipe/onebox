import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getEmail,
  getInbox,
  parseCategory,
  replyDraft,
  searchEmails,
} from "@/lib/emails";
import { supabaseAdmin } from "@/lib/supabase";
import { archive, snooze } from "./actions";
import { EmailBody, EmailBodyPlaceholder } from "./email-body";
import { EmailList } from "./email-list";
import { EmailPanel } from "./email-panel";
import { FilterBar } from "./filter-bar";
import { InboxColumns } from "./inbox-columns";
import { RealtimeInbox } from "./realtime-inbox";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{
    importancia?: string;
    conta?: string;
    email?: string;
    q?: string;
  }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/");
  }

  const { data: accounts } = await supabaseAdmin
    .from("email_accounts")
    .select("id, email_gmail")
    .eq("user_id", userId)
    .is("disconnected_at", null)
    .order("created_at")
    .throwOnError();

  const params = await searchParams;
  const term = params.q?.trim() ?? "";
  const category = parseCategory(params.importancia);
  const accountId = accounts.find((a) => a.id === params.conta)?.id;

  const [emails, openEmail] = await Promise.all([
    term
      ? searchEmails(userId, term)
      : getInbox(userId, { category, accountId }),
    params.email ? getEmail(userId, params.email) : null,
  ]);

  return (
    <>
      <RealtimeInbox
        supabaseUrl={process.env.SUPABASE_URL!}
        anonKey={process.env.SUPABASE_ANON_KEY!}
      />
      {term ? (
        <SearchHeader term={term} results={emails.length} />
      ) : (
        <FilterBar accounts={accounts} />
      )}

      <InboxColumns
        list={
          <EmailList
            emails={emails}
            filtered={category !== undefined || accountId !== undefined}
            searchTerm={term || undefined}
            openEmailId={openEmail?.id}
            onArchive={term ? undefined : archive}
            onSnooze={term ? undefined : snooze}
          />
        }
        panel={
          openEmail ? (
            <EmailPanel email={openEmail} replyDraft={replyDraft(openEmail)}>
              <Suspense fallback={<EmailBodyPlaceholder />}>
                <EmailBody
                  accountId={openEmail.account_id}
                  gmailMessageId={openEmail.gmail_message_id}
                />
              </Suspense>
            </EmailPanel>
          ) : null
        }
      />
    </>
  );
}

function SearchHeader({ term, results }: { term: string; results: number }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">
        {results === 1 ? "1 resultado para" : `${results} resultados para`}{" "}
        <span className="font-medium text-foreground">«{term}»</span>
      </p>
      <Link
        href="/inbox"
        className="rounded-full border border-hairline px-4 py-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        Limpar pesquisa
      </Link>
    </div>
  );
}
