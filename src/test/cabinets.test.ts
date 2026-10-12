import { describe, expect, it } from "vitest";
import { consolidateDimensions, parseMeasure, sniffImageType, validateUploadMeta } from "@/lib/cabinets";

describe("medidas", () => {
  it("valor digitado pelo usuário fica como informada", () => {
    const rows = consolidateDimensions({ largura_cm: 240 }, {}, []);
    const r = rows.find((x) => x.grupo === "Superiores" && x.campo === "Largura total")!;
    expect(r.status).toBe("informada");
    expect(r.valor).toBe("240 cm");
  });
  it("sem medida e sem estimativa fica pendente", () => {
    const rows = consolidateDimensions({}, {}, []);
    expect(rows.every((r) => r.status === "pendente")).toBe(true);
  });
  it("estimativa visual nunca substitui medida informada", () => {
    const rows = consolidateDimensions({}, { altura_cm: 90 }, [
      { item: "Inferiores altura", faixa: "80–95 cm", justificativa: "proporção" },
    ]);
    const r = rows.find((x) => x.grupo === "Inferiores" && x.campo === "Altura")!;
    expect(r.status).toBe("informada");
    expect(r.valor).toBe("90 cm");
  });
  it("estimativa visual aparece como estimada quando não há medida", () => {
    const rows = consolidateDimensions({}, {}, [
      { item: "Superiores altura", faixa: "60–75 cm", justificativa: "azulejos" },
    ]);
    const r = rows.find((x) => x.grupo === "Superiores" && x.campo === "Altura")!;
    expect(r.status).toBe("estimada");
  });
  it("rejeita medidas inválidas", () => {
    expect(parseMeasure("-5", 400)).toBeNull();
    expect(parseMeasure("0", 400)).toBeNull();
    expect(parseMeasure("500", 400)).toBeNull();
    expect(parseMeasure("72,5", 400)).toBe(72.5);
  });
});

describe("upload", () => {
  it("aceita só JPG/PNG/WEBP até 10 MB", () => {
    expect(validateUploadMeta("image/gif", 100)).not.toBeNull();
    expect(validateUploadMeta("image/png", 11 * 1024 * 1024)).not.toBeNull();
    expect(validateUploadMeta("image/jpeg", 1000)).toBeNull();
  });
  it("detecta assinatura real", () => {
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe("image/png");
    expect(sniffImageType(new Uint8Array([0x3c, 0x73, 0x76, 0x67, 0, 0, 0, 0, 0, 0, 0, 0]))).toBeNull();
  });
});
