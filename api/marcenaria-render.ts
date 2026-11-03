import type { IncomingMessage, ServerResponse } from "node:http";
import { bytesToDataUrl, runRender } from "../src/lib/ai.server";

const MAX_BODY_BYTES = 20 * 1024 * 1024;

type RenderRequest = IncomingMessage & { body?: unknown };

type RenderResponse = ServerResponse & {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};

function send(res: RenderResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function secretsMatch(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= provided.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

async function readBody(req: RenderRequest): Promise<unknown> {
  if (req.body !== undefined) return req.body;
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > MAX_BODY_BYTES) throw new Error("payload_too_large");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export default async function handler(req: RenderRequest, res: RenderResponse) {
  if (req.method !== "POST") return send(res, 405, { code: "method_not_allowed" });
  const expectedSecret = process.env["MARCENARIA_MAGICA_RENDER_SECRET"] ?? "";
  const providedSecret = String(req.headers["x-marcenapp-render-secret"] ?? "");
  if (!expectedSecret || !secretsMatch(providedSecret, expectedSecret)) {
    return send(res, 401, { code: "unauthorized", message: "Credencial de integração inválida." });
  }

  try {
    const body = await readBody(req) as {
      prompt?: unknown;
      image?: { mimeType?: unknown; data?: unknown };
    };
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const mimeType = body.image?.mimeType;
    const data = body.image?.data;
    if (
      !prompt || prompt.length > 4000 ||
      typeof mimeType !== "string" || !/^image\/(png|jpeg|jpg|webp)$/i.test(mimeType) ||
      typeof data !== "string" || data.length < 1 || data.length > 15_000_000
    ) {
      return send(res, 400, { code: "validation_error", message: "Prompt ou imagem inválidos." });
    }

    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    const file = new File([bytes], "ambiente-referencia", { type: mimeType });
    const output = await runRender(file, prompt);
    return send(res, 200, {
      imageBase64: bytesToDataUrl(output, "image/png"),
      model: "openai/gpt-image-2.5-sunburst",
    });
  } catch (error) {
    const code = error instanceof Error && error.message === "payload_too_large" ? "payload_too_large" : "render_failed";
    console.error("marcenaria-render Vercel function error", error);
    return send(res, code === "payload_too_large" ? 413 : 502, {
      code,
      message: code === "payload_too_large" ? "O payload excede o limite permitido." : "O motor de render não conseguiu concluir a imagem.",
    });
  }
}
