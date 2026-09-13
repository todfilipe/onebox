import { describe, expect, it, vi } from "vitest";
import { senderAddress, senderName } from "./email-list";
import { formatFullDate, formatReceivedAt } from "./local-time";

describe("senderName", () => {
  it("mostra só o nome quando o remetente vem no formato Nome <email>", () => {
    expect(senderName("Marta Correia <marta.correia@empresa.pt>")).toBe(
      "Marta Correia",
    );
  });

  it("mostra o endereço quando não há nome", () => {
    expect(senderName("billing@cloudify.io")).toBe("billing@cloudify.io");
  });
});

describe("senderAddress", () => {
  it("extrai o endereço de dentro dos sinais de menor e maior", () => {
    expect(senderAddress("Marta Correia <marta.correia@empresa.pt>")).toBe(
      "marta.correia@empresa.pt",
    );
  });

  it("devolve o próprio valor quando o remetente já é só o endereço", () => {
    expect(senderAddress("billing@cloudify.io")).toBe("billing@cloudify.io");
  });
});

describe("formatReceivedAt", () => {
  it("mostra a hora para emails de hoje", () => {
    vi.setSystemTime(new Date("2026-07-28T18:00:00"));
    expect(formatReceivedAt("2026-07-28T09:05:00")).toBe("09:05");
    vi.useRealTimers();
  });

  it("mostra o dia e o mês para emails anteriores", () => {
    vi.setSystemTime(new Date("2026-07-28T18:00:00"));
    expect(formatReceivedAt("2026-07-12T09:05:00")).toBe("12 jul");
    vi.useRealTimers();
  });
});

describe("formatFullDate", () => {
  it("mostra a data completa com hora", () => {
    expect(formatFullDate("2026-07-12T09:05:00")).toBe("12 jul 2026, 09:05");
  });
});
