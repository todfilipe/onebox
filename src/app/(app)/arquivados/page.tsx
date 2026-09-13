import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getArchived, getEmail, replyDraft } from "@/lib/emails";
import { unarchive } from "../inbox/actions";
import { EmailBody, EmailBodyPlaceholder } from "../inbox/email-body";
import { EmailList } from "../inbox/email-list";
import { EmailPanel } from "../inbox/email-panel";
import { InboxColumns } from "../inbox/inbox-columns";
import { RealtimeInbox } from "../inbox/realtime-inbox";

export default async function ArchivedPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/");
  }

  const params = await searchParams;

  const [emails, openEmail] = await Promise.all([
    getArchived(userId),
    params.email ? getEmail(userId, params.email) : null,
  ]);

  return (
    <>
      <RealtimeInbox
        supabaseUrl={process.env.SUPABASE_URL!}
        anonKey={process.env.SUPABASE_ANON_KEY!}
      />
      <h1 className="mb-4 text-xl font-semibold">Arquivados</h1>

      <InboxColumns
        list={
          <EmailList
            emails={emails}
            filtered={false}
            openEmailId={openEmail?.id}
            onUnarchive={unarchive}
            emptyState={{
              title: "Ainda não há nada arquivado",
              hint: "Os emails que arquivares na inbox aparecem aqui, prontos para reabrir ou repor quando precisares.",
            }}
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
