import { describe, expect, it } from "vitest";
import { snoozeOptions } from "./snooze";

describe("opções de adiar", () => {
  it("calcula as três datas a partir de uma quarta-feira à tarde", () => {
    const options = snoozeOptions(new Date("2026-07-29T15:00:00"));

    expect(options.map((o) => o.label)).toEqual([
      "Daqui a 3 horas",
      "Amanhã às 9:00",
      "Segunda às 9:00",
    ]);
    expect(options[0]!.until).toEqual(new Date("2026-07-29T18:00:00"));
    expect(options[1]!.until).toEqual(new Date("2026-07-30T09:00:00"));
    expect(options[2]!.until).toEqual(new Date("2026-08-03T09:00:00"));
  });

  it("numa segunda-feira, 'Segunda às 9:00' aponta para a semana seguinte", () => {
    const options = snoozeOptions(new Date("2026-07-27T10:00:00"));

    expect(options[2]!.until).toEqual(new Date("2026-08-03T09:00:00"));
  });

  it("num domingo, 'Segunda às 9:00' é já no dia seguinte", () => {
    const options = snoozeOptions(new Date("2026-08-02T22:00:00"));

    expect(options[2]!.until).toEqual(new Date("2026-08-03T09:00:00"));
  });
});
