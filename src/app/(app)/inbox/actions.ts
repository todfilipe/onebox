"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { parseTone, rewriteReply } from "@/lib/gemini";
import {
  archiveEmail,
  cancelSnoozeEmail,
  markEmailAsRead,
  parseCategory,
  reclassifyEmail,
  saveEmailReply,
  sendEmailReply,
  snoozeEmail,
  unarchiveEmail,
} from "@/lib/emails";

// O painel de email abre a partir de qualquer uma das três vistas, por isso todas revalidam.
function revalidateEmailViews() {
  revalidatePath("/inbox");
  revalidatePath("/arquivados");
  revalidatePath("/adiados");
}

export async function markAsRead(emailId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return;
  }

  await markEmailAsRead(session.user.id, emailId);
  revalidateEmailViews();
}

export async function archive(emailId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return;
  }

  await archiveEmail(session.user.id, emailId);
  revalidateEmailViews();
}

export async function unarchive(emailId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return;
  }

  await unarchiveEmail(session.user.id, emailId);
  revalidateEmailViews();
}

export async function reclassify(emailId: string, category: string | null) {
  const session = await auth();

  if (!session?.user?.id) {
    return;
  }

  const parsed = category === null ? null : parseCategory(category);
  if (parsed === undefined) {
    return;
  }

  await reclassifyEmail(session.user.id, emailId, parsed);
  revalidateEmailViews();
}

export async function snooze(emailId: string, until: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return;
  }

  const date = new Date(until);
  if (Number.isNaN(date.getTime()) || date <= new Date()) {
    return;
  }

  await snoozeEmail(session.user.id, emailId, date.toISOString());
  revalidateEmailViews();
}

export async function cancelSnooze(emailId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return;
  }

  await cancelSnoozeEmail(session.user.id, emailId);
  revalidateEmailViews();
}

export async function sendReply(emailId: string, reply: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { sent: false };
  }

  try {
    await sendEmailReply(session.user.id, emailId, reply);
  } catch (error) {
    console.error(`Envio da resposta falhou (email ${emailId}):`, error);
    return { sent: false };
  }

  revalidateEmailViews();
  return { sent: true };
}

export async function adjustTone(text: string, tone: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { text: null };
  }

  const parsed = parseTone(tone);
  if (!parsed || text.trim() === "") {
    return { text: null };
  }

  try {
    return { text: await rewriteReply(parsed, text) };
  } catch (error) {
    console.error(`Ajuste de tom falhou (${tone}):`, error);
    return { text: null };
  }
}

export async function saveReply(emailId: string, reply: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return;
  }

  await saveEmailReply(session.user.id, emailId, reply);
  revalidateEmailViews();
}
