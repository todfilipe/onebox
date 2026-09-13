import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const sendGmailReplyMock = vi.hoisted(() => vi.fn());
vi.mock("./gmail-send", () => ({ sendGmailReply: sendGmailReplyMock }));
import {
  archiveEmail,
  cancelSnoozeEmail,
  getArchived,
  getEmail,
  getInbox,
  getSnoozed,
  parseCategory,
  reclassifyEmail,
  replyDraft,
  saveEmailReply,
  sendEmailReply,
  snoozeEmail,
  unarchiveEmail,
} from "./emails";
import { supabaseAdmin } from "./supabase";

const testUserEmail = `teste-${randomUUID()}@onebox.local`;

let userId: string;
let personal: string;
let work: string;

const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 3600_000).toISOString();

const hoursFromNow = (h: number) =>
  new Date(Date.now() + h * 3600_000).toISOString();

beforeAll(async () => {
  const { data: user } = await supabaseAdmin
    .from("users")
    .insert({ email: testUserEmail, name: "Utilizador de teste" })
    .select("id")
    .single()
    .throwOnError();
  userId = user!.id;

  const { data: accounts } = await supabaseAdmin
    .from("email_accounts")
    .insert([
      { user_id: userId, email_gmail: `pessoal-${randomUUID()}@gmail.com` },
      { user_id: userId, email_gmail: `trabalho-${randomUUID()}@gmail.com` },
      {
        user_id: userId,
        email_gmail: `antiga-${randomUUID()}@gmail.com`,
        disconnected_at: hoursAgo(1),
      },
    ])
    .select("id, email_gmail")
    .throwOnError();

  const [personalAccount, workAccount, oldAccount] = accounts!.map(
    (a) => a.id,
  ) as [string, string, string];
  personal = personalAccount;
  work = workAccount;

  await supabaseAdmin
    .from("emails")
    .insert([
      {
        account_id: personal,
        gmail_message_id: "t-1",
        sender: "Clínica <geral@clinica.pt>",
        subject: "Lembrete de consulta",
        ai_suggested_reply: "Confirmo a consulta, obrigado.",
        category: "alta",
        state: "ativo",
        received_at: hoursAgo(1),
      },
      {
        account_id: personal,
        gmail_message_id: "t-2",
        sender: "Booking <noreply@booking.com>",
        subject: "Ofertas de fim de semana",
        category: "baixa",
        state: "ativo",
        received_at: hoursAgo(5),
      },
      {
        account_id: work,
        gmail_message_id: "t-3",
        sender: "Marta Correia <marta.correia@empresa.pt>",
        subject: "Reunião antecipada",
        category: "media",
        manual_category: "alta",
        state: "ativo",
        received_at: hoursAgo(2),
      },
      {
        account_id: work,
        gmail_message_id: "t-4",
        sender: "LinkedIn <notifications@linkedin.com>",
        subject: "Visualizações do seu perfil",
        category: "media",
        state: "arquivado",
        received_at: hoursAgo(3),
      },
      {
        account_id: oldAccount,
        gmail_message_id: "t-5",
        sender: "Banco <geral@banco.pt>",
        subject: "Extrato mensal",
        category: "alta",
        state: "ativo",
        received_at: hoursAgo(4),
      },
      {
        account_id: oldAccount,
        gmail_message_id: "t-6",
        sender: "Arquivo <arquivo@antiga.pt>",
        subject: "Email arquivado de conta desligada",
        category: "media",
        state: "arquivado",
        received_at: hoursAgo(6),
      },
      {
        account_id: personal,
        gmail_message_id: "t-7",
        sender: "Banco <geral@banco.pt>",
        subject: "Fatura do cartão",
        category: "media",
        state: "adiado",
        received_at: hoursAgo(7),
        snoozed_until: hoursFromNow(5),
      },
      {
        account_id: personal,
        gmail_message_id: "t-8",
        sender: "Tech Weekly <newsletter@techweekly.com>",
        subject: "Newsletter de tecnologia",
        category: "baixa",
        state: "adiado",
        received_at: hoursAgo(8),
        snoozed_until: hoursFromNow(1),
      },
      {
        account_id: oldAccount,
        gmail_message_id: "t-9",
        sender: "Newsletter <news@antiga.pt>",
        subject: "Adiado de conta desligada",
        category: "media",
        state: "adiado",
        received_at: hoursAgo(9),
        snoozed_until: hoursFromNow(2),
      },
    ])
    .throwOnError();
});

afterAll(async () => {
  await supabaseAdmin.from("users").delete().eq("id", userId);
});

describe("inbox agregada", () => {
  it("junta as contas ligadas do utilizador, da mensagem mais recente para a mais antiga", async () => {
    const inbox = await getInbox(userId);

    expect(inbox.map((e) => e.subject)).toEqual([
      "Lembrete de consulta",
      "Reunião antecipada",
      "Ofertas de fim de semana",
    ]);
    expect(new Set(inbox.map((e) => e.email_accounts.id))).toEqual(
      new Set([personal, work]),
    );
  });

  it("não mostra emails arquivados nem de contas desligadas", async () => {
    const subjects = (await getInbox(userId)).map((e) => e.subject);

    expect(subjects).not.toContain("Visualizações do seu perfil");
    expect(subjects).not.toContain("Extrato mensal");
  });

  it("não deixa um utilizador ver a inbox de outro", async () => {
    expect(await getInbox(randomUUID())).toEqual([]);
  });

  it("filtra por importância respeitando a reclassificação manual", async () => {
    const high = await getInbox(userId, { category: "alta" });

    expect(high.map((e) => e.subject)).toEqual([
      "Lembrete de consulta",
      "Reunião antecipada",
    ]);
  });

  it("filtra por conta de origem", async () => {
    const inbox = await getInbox(userId, { accountId: work });

    expect(inbox.map((e) => e.subject)).toEqual(["Reunião antecipada"]);
  });
});

describe("resposta mostrada no painel", () => {
  it("mostra a resposta do utilizador quando ela existe", () => {
    expect(
      replyDraft({
        ai_suggested_reply: "Sugestão da IA",
        manual_reply: "O que eu escrevi",
      }),
    ).toBe("O que eu escrevi");
  });

  it("cai na sugestão da IA enquanto o utilizador não escrever nada", () => {
    expect(
      replyDraft({ ai_suggested_reply: "Sugestão da IA", manual_reply: null }),
    ).toBe("Sugestão da IA");
  });

  it("fica vazia quando não há nem sugestão nem resposta escrita", () => {
    expect(replyDraft({ ai_suggested_reply: null, manual_reply: null })).toBe(
      "",
    );
  });
});

describe("gravar a resposta editada", () => {
  const emailId = async () => {
    const inbox = await getInbox(userId, { accountId: personal });
    return inbox.find((e) => e.subject === "Lembrete de consulta")!.id;
  };

  it("guarda o texto do utilizador sem apagar a sugestão da IA", async () => {
    const id = await emailId();

    await saveEmailReply(userId, id, "  Confirmo, até quinta.  ");
    const email = await getEmail(userId, id);

    expect(email!.manual_reply).toBe("Confirmo, até quinta.");
    expect(email!.ai_suggested_reply).toBe("Confirmo a consulta, obrigado.");
    expect(replyDraft(email!)).toBe("Confirmo, até quinta.");
  });

  it("guardar o campo vazio devolve a sugestão da IA", async () => {
    const id = await emailId();

    await saveEmailReply(userId, id, "texto qualquer");
    await saveEmailReply(userId, id, "   ");
    const email = await getEmail(userId, id);

    expect(email!.manual_reply).toBeNull();
    expect(replyDraft(email!)).toBe("Confirmo a consulta, obrigado.");
  });

  it("não deixa outro utilizador escrever a resposta deste email", async () => {
    const id = await emailId();

    await saveEmailReply(userId, id, "resposta do dono");
    await saveEmailReply(randomUUID(), id, "resposta de um intruso");

    expect((await getEmail(userId, id))!.manual_reply).toBe("resposta do dono");
  });
});

describe("enviar a resposta", () => {
  const email = async () => {
    const inbox = await getInbox(userId, { accountId: personal });
    return inbox.find((e) => e.subject === "Lembrete de consulta")!;
  };

  it("não envia emails de outro utilizador nem respostas vazias", async () => {
    sendGmailReplyMock.mockReset();
    const id = (await email()).id;

    await expect(sendEmailReply(randomUUID(), id, "olá")).rejects.toThrow();
    await expect(sendEmailReply(userId, id, "   ")).rejects.toThrow();

    expect(sendGmailReplyMock).not.toHaveBeenCalled();
  });

  it("envia pela conta que recebeu e marca replied_at", async () => {
    sendGmailReplyMock.mockReset();
    const id = (await email()).id;

    await sendEmailReply(userId, id, "  Obrigado, confirmo!  ");

    expect(sendGmailReplyMock).toHaveBeenCalledWith(
      personal,
      "t-1",
      "Obrigado, confirmo!",
    );
    const sent = await getEmail(userId, id);
    expect(sent!.replied_at).not.toBeNull();
    expect(sent!.manual_reply).toBe("Obrigado, confirmo!");
  });

  it("enviar a sugestão da IA tal como está deixa manual_reply a null", async () => {
    sendGmailReplyMock.mockReset();
    const id = (await email()).id;

    await sendEmailReply(userId, id, "Confirmo a consulta, obrigado.");

    expect((await getEmail(userId, id))!.manual_reply).toBeNull();
  });
});

describe("arquivar um email", () => {
  const emailId = async () => {
    const inbox = await getInbox(userId, { accountId: personal });
    return inbox.find((e) => e.subject === "Ofertas de fim de semana")!.id;
  };

  it("não deixa outro utilizador arquivar o email", async () => {
    const id = await emailId();

    await archiveEmail(randomUUID(), id);

    const inbox = await getInbox(userId, { accountId: personal });
    expect(inbox.map((e) => e.id)).toContain(id);
  });

  it("muda o estado para arquivado e o email sai da inbox", async () => {
    const id = await emailId();

    await archiveEmail(userId, id);

    const inbox = await getInbox(userId);
    expect(inbox.map((e) => e.id)).not.toContain(id);
  });
});

describe("reclassificar um email", () => {
  const emailId = async () => {
    const inbox = await getInbox(userId, { accountId: personal });
    return inbox.find((e) => e.subject === "Lembrete de consulta")!.id;
  };

  it("a categoria manual ganha à da IA sem a apagar", async () => {
    const id = await emailId();

    await reclassifyEmail(userId, id, "baixa");

    const email = await getEmail(userId, id);
    expect(email!.category).toBe("alta");
    expect(email!.manual_category).toBe("baixa");
    expect(email!.effective_category).toBe("baixa");
  });

  it("limpar a categoria manual devolve a decisão da IA", async () => {
    const id = await emailId();

    await reclassifyEmail(userId, id, null);

    const email = await getEmail(userId, id);
    expect(email!.manual_category).toBeNull();
    expect(email!.effective_category).toBe("alta");
  });

  it("não deixa outro utilizador reclassificar o email", async () => {
    const id = await emailId();

    await reclassifyEmail(randomUUID(), id, "media");

    expect((await getEmail(userId, id))!.effective_category).toBe("alta");
  });
});

describe("adiar um email", () => {
  const emailId = async () => {
    const inbox = await getInbox(userId, { accountId: work });
    return inbox.find((e) => e.subject === "Reunião antecipada")!.id;
  };

  it("não deixa outro utilizador adiar o email", async () => {
    const id = await emailId();

    await snoozeEmail(
      randomUUID(),
      id,
      new Date(Date.now() + 3600_000).toISOString(),
    );

    expect((await getInbox(userId)).map((e) => e.id)).toContain(id);
  });

  it("um email adiado sai da inbox até à hora de regresso", async () => {
    const id = await emailId();

    await snoozeEmail(
      userId,
      id,
      new Date(Date.now() + 3600_000).toISOString(),
    );

    expect((await getInbox(userId)).map((e) => e.id)).not.toContain(id);
  });

  it("regressa à inbox como ativo quando a hora passa", async () => {
    const { data: snoozed } = await supabaseAdmin
      .from("emails")
      .select("id")
      .eq("account_id", work)
      .eq("state", "adiado")
      .single()
      .throwOnError();

    await supabaseAdmin
      .from("emails")
      .update({ snoozed_until: new Date(Date.now() - 60_000).toISOString() })
      .eq("id", snoozed!.id)
      .throwOnError();

    const inbox = await getInbox(userId);

    expect(inbox.map((e) => e.id)).toContain(snoozed!.id);
    const { data: woken } = await supabaseAdmin
      .from("emails")
      .select("state, snoozed_until")
      .eq("id", snoozed!.id)
      .single()
      .throwOnError();
    expect(woken).toEqual({ state: "ativo", snoozed_until: null });
  });
});

describe("emails arquivados", () => {
  it("lista os arquivados do próprio utilizador, sem contas desligadas", async () => {
    const archived = await getArchived(userId, work);

    expect(archived.map((e) => e.subject)).toEqual([
      "Visualizações do seu perfil",
    ]);
  });

  it("não deixa um utilizador ver os arquivados de outro", async () => {
    expect(await getArchived(randomUUID())).toEqual([]);
  });

  it("não mostra arquivados de contas desligadas", async () => {
    const subjects = (await getArchived(userId)).map((e) => e.subject);

    expect(subjects).not.toContain("Email arquivado de conta desligada");
  });
});

describe("desarquivar um email", () => {
  const emailId = async () => {
    const archived = await getArchived(userId, work);
    return archived.find((e) => e.subject === "Visualizações do seu perfil")!
      .id;
  };

  it("não deixa outro utilizador desarquivar o email", async () => {
    const id = await emailId();

    await unarchiveEmail(randomUUID(), id);

    expect((await getArchived(userId, work)).map((e) => e.id)).toContain(id);
  });

  it("volta a ativo: reaparece na inbox e sai dos arquivados", async () => {
    const id = await emailId();

    await unarchiveEmail(userId, id);

    expect(
      (await getInbox(userId, { accountId: work })).map((e) => e.id),
    ).toContain(id);
    expect((await getArchived(userId, work)).map((e) => e.id)).not.toContain(
      id,
    );
  });
});

describe("emails adiados", () => {
  it("lista os adiados do próprio utilizador, do regresso mais próximo ao mais distante", async () => {
    const snoozed = await getSnoozed(userId);

    expect(snoozed.map((e) => e.subject)).toEqual([
      "Newsletter de tecnologia",
      "Fatura do cartão",
    ]);
  });

  it("não deixa um utilizador ver os adiados de outro", async () => {
    expect(await getSnoozed(randomUUID())).toEqual([]);
  });

  it("não mostra adiados de contas desligadas", async () => {
    const subjects = (await getSnoozed(userId)).map((e) => e.subject);

    expect(subjects).not.toContain("Adiado de conta desligada");
  });
});

describe("cancelar o adiamento de um email", () => {
  const emailId = async () => {
    const snoozed = await getSnoozed(userId, personal);
    return snoozed.find((e) => e.subject === "Newsletter de tecnologia")!.id;
  };

  it("não deixa outro utilizador cancelar o adiamento", async () => {
    const id = await emailId();

    await cancelSnoozeEmail(randomUUID(), id);

    expect((await getSnoozed(userId, personal)).map((e) => e.id)).toContain(id);
  });

  it("volta a ativo e limpa a hora de regresso: reaparece na inbox e sai dos adiados", async () => {
    const id = await emailId();

    await cancelSnoozeEmail(userId, id);

    expect(
      (await getInbox(userId, { accountId: personal })).map((e) => e.id),
    ).toContain(id);
    expect((await getSnoozed(userId, personal)).map((e) => e.id)).not.toContain(
      id,
    );

    const { data } = await supabaseAdmin
      .from("emails")
      .select("state, snoozed_until")
      .eq("id", id)
      .single()
      .throwOnError();
    expect(data).toEqual({ state: "ativo", snoozed_until: null });
  });
});

describe("arquivar um email adiado", () => {
  it("descarta a hora de regresso ao arquivar", async () => {
    const snoozed = await getSnoozed(userId, personal);
    const id = snoozed.find((e) => e.subject === "Fatura do cartão")!.id;

    await archiveEmail(userId, id);

    const { data } = await supabaseAdmin
      .from("emails")
      .select("state, snoozed_until")
      .eq("id", id)
      .single()
      .throwOnError();
    expect(data).toEqual({ state: "arquivado", snoozed_until: null });
  });
});

describe("categoria vinda do URL", () => {
  it("aceita as três categorias válidas", () => {
    expect(parseCategory("alta")).toBe("alta");
    expect(parseCategory("media")).toBe("media");
    expect(parseCategory("baixa")).toBe("baixa");
  });

  it("ignora valores inventados ou ausentes", () => {
    expect(parseCategory("urgente")).toBeUndefined();
    expect(parseCategory("")).toBeUndefined();
    expect(parseCategory(undefined)).toBeUndefined();
  });
});
