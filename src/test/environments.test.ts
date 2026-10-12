import { describe, expect, it } from "vitest";
import {
  ENVIRONMENTS,
  getModulesForEnvironment,
  isEnvironmentId,
  MARCENA_INTEGRATION_CONTRACT,
} from "@/lib/environments";

describe("catálogo de ambientes da Marcenaria Mágica", () => {
  it("oferece os ambientes residenciais e comerciais principais", () => {
    const ids = ENVIRONMENTS.map((environment) => environment.id);
    expect(ids).toEqual(expect.arrayContaining([
      "cozinha", "sala", "living", "quarto", "closet", "banheiro",
      "lavabo", "lavanderia", "churrasqueira", "home-office", "comercial", "outro",
    ]));
  });

  it("apresenta módulos específicos de cozinha", () => {
    const ids = getModulesForEnvironment("cozinha").map((module) => module.id);
    expect(ids).toEqual(expect.arrayContaining([
      "inferiores", "superiores", "torre-quente", "bancada", "ilha", "peninsula",
    ]));
  });

  it("retorna módulos diferentes conforme o ambiente", () => {
    expect(getModulesForEnvironment("banheiro").some((module) => module.id === "espelheira")).toBe(true);
    expect(getModulesForEnvironment("lavanderia").some((module) => module.id === "vassoureiro")).toBe(true);
    expect(getModulesForEnvironment("comercial").some((module) => module.id === "recepcao")).toBe(true);
  });

  it("valida os identificadores de ambiente", () => {
    expect(isEnvironmentId("cozinha")).toBe(true);
    expect(isEnvironmentId("garagem")).toBe(false);
  });

  it("expõe um contrato versionado para integração futura com Marcena", () => {
    expect(MARCENA_INTEGRATION_CONTRACT.schemaVersion).toBe("1.0.0");
    expect(MARCENA_INTEGRATION_CONTRACT.capabilities).toContain("photo-to-render");
  });
});
