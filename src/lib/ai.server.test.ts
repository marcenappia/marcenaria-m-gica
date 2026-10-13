import { describe, expect, it } from "vitest";
import { AiError, friendlyStatus } from "./ai.server";

describe("AI provider error handling", () => {
  it("gives a safe, actionable message for missing or invalid credentials", () => {
    expect(friendlyStatus(401, "unauthorized")).toContain("Credencial de IA inválida ou ausente");
  });

  it("preserves billing context when the provider returns a payment error", () => {
    expect(friendlyStatus(402, JSON.stringify({ error: { message: "payment required" } }))).toContain("Créditos de IA insuficientes");
    expect(friendlyStatus(402, JSON.stringify({ error: { message: "payment required" } }))).toContain("payment required");
  });

  it("makes provider authorization failures diagnosable", () => {
    expect(friendlyStatus(403, JSON.stringify({ error: { message: "valid credit card required" } }))).toContain("Acesso ao modelo negado");
    expect(friendlyStatus(403, JSON.stringify({ error: { message: "valid credit card required" } }))).toContain("valid credit card required");
  });

  it("does not treat rate limits as billing or authentication errors", () => {
    expect(friendlyStatus(429, "rate limit")).toContain("Limite de requisições atingido");
  });

  it("supports structured errors for internal propagation", () => {
    const error = new AiError(502, "invalid image response");
    expect(error.status).toBe(502);
    expect(error.message).toBe("invalid image response");
  });
});
