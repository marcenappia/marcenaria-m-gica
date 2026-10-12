import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FIELDS, sanitizeCabinet, sniffImageType, type CabinetInput } from "./cabinets";

const idSchema = z.object({ id: z.string().uuid() });

function describeCabinet(name: string, c: CabinetInput) {
  const parts = FIELDS.map((f) => {
    const v = c[f.key];
    return `${f.label}: ${typeof v === "number" ? `${v}${f.unit ? " " + f.unit : ""} (informada)` : "não informada"}`;
  });
  return `${name} — ${parts.join("; ")}${c.observacoes ? `; Obs.: ${c.observacoes}` : ""}`;
}

async function loadProjectAndImage(supabase: any, id: string) {
  const { data: p, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error || !p) throw new Error("Projeto não encontrado.");
  if (!p.original_path) throw new Error("Projeto sem foto original.");
  const { data: blob, error: dlErr } = await supabase.storage.from("ambientes").download(p.original_path);
  if (dlErr || !blob) throw new Error("Não foi possível ler a foto original.");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const mime = sniffImageType(bytes);
  if (!mime) throw new Error("Arquivo da foto inválido (assinatura não é JPG/PNG/WEBP).");
  return { p, bytes, mime };
}

export const aiDiagnostics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { ANALYSIS_MODEL, RENDER_MODEL, GATEWAY } = await import("./ai.server");
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) {
      return { keyPresent: false, reachable: false, analysisModel: ANALYSIS_MODEL, renderModel: RENDER_MODEL, analysisAvailable: false, renderAvailable: false, error: "LOVABLE_API_KEY ausente no servidor." };
    }
    try {
      const r = await fetch(`${GATEWAY}/v1/models`, { headers: { Authorization: `Bearer ${key}` } });
      if (!r.ok) {
        return { keyPresent: true, reachable: false, analysisModel: ANALYSIS_MODEL, renderModel: RENDER_MODEL, analysisAvailable: false, renderAvailable: false, error: `Gateway respondeu ${r.status}.` };
      }
      const j = (await r.json()) as { data?: { id: string }[] };
      const ids = new Set((j.data ?? []).map((m) => m.id));
      return { keyPresent: true, reachable: true, analysisModel: ANALYSIS_MODEL, renderModel: RENDER_MODEL, analysisAvailable: ids.has(ANALYSIS_MODEL), renderAvailable: ids.has(RENDER_MODEL), error: null as string | null };
    } catch (e) {
      return { keyPresent: true, reachable: false, analysisModel: ANALYSIS_MODEL, renderModel: RENDER_MODEL, analysisAvailable: false, renderAvailable: false, error: e instanceof Error ? e.message : "Falha de rede." };
    }
  });

export const analyzeProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { runAnalysis, bytesToDataUrl, AiError } = await import("./ai.server");
    await supabase.from("projects").update({ analysis_status: "running", analysis_error: null }).eq("id", data.id);
    try {
      const { p, bytes, mime } = await loadProjectAndImage(supabase, data.id);
      const upper = sanitizeCabinet(p.upper_cabinets);
      const lower = sanitizeCabinet(p.lower_cabinets);
      const text = [
        `Projeto: ${p.title}`,
        `Pedido do cliente: ${p.description || "(sem descrição)"}`,
        p.style ? `Estilo/acabamento desejado: ${p.style}` : "",
        describeCabinet("Armários superiores", upper),
        describeCabinet("Armários inferiores", lower),
      ].filter(Boolean).join("\n");
      const analysis = await runAnalysis(text, bytesToDataUrl(bytes, mime));
      await supabase.from("projects").update({ analysis, analysis_status: "done", analysis_error: null }).eq("id", data.id);
      return { ok: true as const };
    } catch (e) {
      const msg = e instanceof AiError || e instanceof Error ? e.message : "Erro desconhecido";
      await supabase.from("projects").update({ analysis_status: "error", analysis_error: msg }).eq("id", data.id);
      return { ok: false as const, error: msg };
    }
  });

export const renderProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { runRender, RENDER_MODEL } = await import("./ai.server");
    await supabase.from("projects").update({ render_status: "running", render_error: null }).eq("id", data.id);
    try {
      const { p, bytes, mime } = await loadProjectAndImage(supabase, data.id);
      if (p.analysis_status !== "done" || !p.analysis) throw new Error("Rode a análise antes de gerar o render.");
      const upper = sanitizeCabinet(p.upper_cabinets);
      const lower = sanitizeCabinet(p.lower_cabinets);
      const a = p.analysis as { prompt_render?: string; proposta?: { superiores?: string; inferiores?: string; materiais?: string[] } };
      const prompt = [
        "Photorealistic interior design render. Edit THIS exact photo: keep the same camera angle, perspective, walls, windows, doors, floor, ceiling and lighting.",
        "Only add/replace custom-made Brazilian joinery (marcenaria) as described. Do not add any text, labels, dimension lines or watermarks.",
        a.prompt_render ?? "",
        `Client request (Portuguese): ${p.description}`,
        p.style ? `Style/finish: ${p.style}` : "",
        a.proposta?.superiores ? `Upper cabinets: ${a.proposta.superiores}` : "",
        a.proposta?.inferiores ? `Base cabinets: ${a.proposta.inferiores}` : "",
        upper.modulos ? `Upper cabinets have ${upper.modulos} modules.` : "",
        lower.modulos ? `Base cabinets have ${lower.modulos} modules.` : "",
      ].filter(Boolean).join("\n").slice(0, 3800);
      const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
      const file = new File([bytes], `ambiente.${ext}`, { type: mime });
      const out = await runRender(file, prompt);
      const path = `${userId}/${data.id}/render-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage.from("ambientes").upload(path, out, { contentType: "image/png", upsert: false });
      if (upErr) throw new Error(`Falha ao salvar o render: ${upErr.message}`);
      await supabase.from("projects").update({ render_path: path, render_status: "done", render_error: null, render_model: RENDER_MODEL }).eq("id", data.id);
      return { ok: true as const };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      await supabase.from("projects").update({ render_status: "error", render_error: msg }).eq("id", data.id);
      return { ok: false as const, error: msg };
    }
  });
