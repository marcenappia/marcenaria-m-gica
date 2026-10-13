import { describe, expect, it } from "vitest";
import { buildDecorationGuide, DIGITAL_PROMOB_SKILL, INTERIOR_DESIGN_RENDER_SKILL, RENDER_EDIT_PRESERVATION_SKILL, TECHNICAL_CABINETRY_SKILL } from "./design-skills";

describe("design skills", () => {
  it("keeps render guidance available locally without a provider call", () => {
    expect(INTERIOR_DESIGN_RENDER_SKILL).toContain("estilo");
    expect(TECHNICAL_CABINETRY_SKILL).toContain("dimensions");
    expect(RENDER_EDIT_PRESERVATION_SKILL).toContain("change only");
    expect(DIGITAL_PROMOB_SKILL).toContain("supplied real-room photo");
    expect(DIGITAL_PROMOB_SKILL).toContain("module count");
  });

  it("builds a kitchen decoration guide without AI and with buying cautions", () => {
    const guide = buildDecorationGuide({
      title: "Cozinha planejada",
      description: "Cozinha com bancada e armários",
      style: "contemporâneo clean",
      analysis: { ambiente: { tipo: "Cozinha", descricao: "Cozinha compacta" }, proposta: { materiais: ["MDF carvalho claro"] } },
    });
    expect(guide.aiCost).toBe(0);
    expect(guide.suggestions.some((item) => item.category === "Eletrodomésticos")).toBe(true);
    expect(guide.suggestions.some((item) => item.category === "Materiais do projeto")).toBe(true);
    expect(guide.suggestions.every((item) => item.buyingNote.includes("não produto validado"))).toBe(true);
  });

  it("uses a generic safe guide when the room is unknown", () => {
    const guide = buildDecorationGuide({ title: "Projeto", description: "Ambiente novo" });
    expect(guide.suggestions.length).toBeGreaterThan(0);
    expect(guide.suggestions.every((item) => item.confidence === "generico")).toBe(true);
  });
});
