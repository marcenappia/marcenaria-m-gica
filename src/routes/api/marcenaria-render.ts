import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { bytesToDataUrl, runRender } from "@/lib/ai.server";

const MAX_BODY_BYTES = 20 * 1024 * 1024;
const BodySchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
  image: z.object({
    mimeType: z.string().regex(/^image\/(png|jpeg|jpg|webp)$/i),
    data: z.string().min(1).max(15_000_000),
  }),
});

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function hasBodyWithinLimit(request: Request): boolean {
  const length = Number(request.headers.get("content-length") ?? "0");
  return !length || (Number.isFinite(length) && length <= MAX_BODY_BYTES);
}

function secretsMatch(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= provided.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

export const Route = createFileRoute("/api/marcenaria-render")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expectedSecret = process.env["MARCENARIA_MAGICA_RENDER_SECRET"];
        const providedSecret = request.headers.get("x-marcenapp-render-secret") ?? "";
        if (!expectedSecret || !secretsMatch(providedSecret, expectedSecret)) {
          return json({ code: "unauthorized", message: "Credencial de integração inválida." }, 401);
        }
        if (!hasBodyWithinLimit(request)) {
          return json({ code: "payload_too_large", message: "O payload excede o limite permitido." }, 413);
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ code: "invalid_json", message: "JSON inválido." }, 400);
        }
        const parsed = BodySchema.safeParse(raw);
        if (!parsed.success) {
          return json({ code: "validation_error", message: "Prompt ou imagem inválidos." }, 400);
        }

        try {
          const { prompt, image } = parsed.data;
          const binary = atob(image.data);
          const bytes = new Uint8Array(binary.length);
          for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
          const file = new File([bytes], "ambiente-referencia", { type: image.mimeType });
          const output = await runRender(file, prompt);
          return json({
            imageBase64: bytesToDataUrl(output, "image/png"),
            model: "openai/gpt-image-2.5-sunburst",
          });
        } catch (error) {
          console.error("marcenaria-render integration error", error);
          return json({ code: "render_failed", message: "O motor de render não conseguiu concluir a imagem." }, 502);
        }
      },
    },
  },
});
