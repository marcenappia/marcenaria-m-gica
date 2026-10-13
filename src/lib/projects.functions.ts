import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FIELDS, sanitizeCabinet, sniffImageType, type CabinetInput } from "./cabinets";
import { buildDecorationGuide, DIGITAL_PROMOB_SKILL, INTERIOR_DESIGN_RENDER_SKILL, RENDER_EDIT_PRESERVATION_SKILL, TECHNICAL_CABINETRY_SKILL } from "./design-skills";

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
    const vercelKey = process.env["AI_GATEWAY_API_KEY"] || process.env["VERCEL_OIDC_TOKEN"];
    const vercelExpected = Boolean(vercelKey) || process.env["VERCEL"] === "1" || process.env["AI_PROVIDER"]?.toLowerCase() === "vercel";
    const key = vercelKey || (vercelExpected ? undefined : process.env["LOVABLE_API_KEY"]);
    const baseUrl = vercelExpected ? "https://ai-gateway.vercel.sh" : GATEWAY;
    if (!key) {
      const provider = vercelExpected ? "AI_GATEWAY_API_KEY ou VERCEL_OIDC_TOKEN" : "LOVABLE_API_KEY";
      return { keyPresent: false, reachable: false, analysisModel: ANALYSIS_MODEL, renderModel: RENDER_MODEL, analysisAvailable: false, renderAvailable: false, error: `${provider} ausente no servidor.` };
    }
    try {
      const r = await fetch(`${baseUrl}/v1/models`, { headers: { Authorization: `Bearer ${key}` } });
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
      const { error: saveAnalysisError } = await supabase.from("projects")
        .update({ analysis, analysis_status: "done", analysis_error: null })
        .eq("id", data.id);
      if (saveAnalysisError) throw new Error(`A análise foi concluída, mas não foi possível salvá-la no projeto: ${saveAnalysisError.message}`);
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
        INTERIOR_DESIGN_RENDER_SKILL,
        TECHNICAL_CABINETRY_SKILL,
        RENDER_EDIT_PRESERVATION_SKILL,
        DIGITAL_PROMOB_SKILL,
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
      const { error: saveRenderError } = await supabase.from("projects")
        .update({ render_path: path, render_status: "done", render_error: null, render_model: RENDER_MODEL })
        .eq("id", data.id);
      if (saveRenderError) {
        // Do not report success if the image exists in Storage but the project cannot reference it.
        await supabase.storage.from("ambientes").remove([path]).catch(() => undefined);
        throw new Error(`O render foi gerado, mas não foi possível vinculá-lo ao projeto: ${saveRenderError.message}`);
      }
      return { ok: true as const };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      await supabase.from("projects").update({ render_status: "error", render_error: msg }).eq("id", data.id);
      return { ok: false as const, error: msg };
    }
  });


const editRenderSchema = z.object({
  id: z.string().uuid(),
  instruction: z.string().trim().min(3, "Descreva a alteração desejada.").max(1500, "A instrução deve ter até 1500 caracteres."),
});

/** Edita o render atual sem alterar a foto original; cada resultado vira uma nova versão no Storage. */
export const editRender = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => editRenderSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { runRender, RENDER_MODEL } = await import("./ai.server");
    try {
      const { data: p, error: projectError } = await supabase
        .from("projects")
        .select("id, render_path, analysis")
        .eq("id", data.id)
        .single();
      if (projectError || !p) throw new Error("Projeto não encontrado.");
      if (!p.render_path) throw new Error("Gere um render antes de editar.");
      if (!p.render_path.startsWith(`${userId}/${data.id}/`)) throw new Error("O render não pertence a este projeto.");

      const { data: blob, error: downloadError } = await supabase.storage.from("ambientes").download(p.render_path);
      if (downloadError || !blob) throw new Error("Não foi possível abrir o render atual.");
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const mime = sniffImageType(bytes);
      if (!mime) throw new Error("O arquivo do render não é uma imagem válida.");
      const extension = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
      const file = new File([bytes], `render-atual.${extension}`, { type: mime });
      const prompt = [
        "Make a localized edit to THIS existing interior-design render, not a new unrelated design.",
        RENDER_EDIT_PRESERVATION_SKILL,
        DIGITAL_PROMOB_SKILL,
        TECHNICAL_CABINETRY_SKILL,
        "STRICT PRESERVATION: keep the same camera angle, perspective, room geometry, architecture, walls, doors, windows, floor, ceiling, lighting, shadows, composition, and every furniture/detail not explicitly mentioned by the user.",
        "Change only what the user explicitly requests. Keep the existing proportions and layout. Do not add text, dimensions, labels, watermarks, or unrelated objects.",
        `User's requested edit: ${data.instruction}`,
      ].join("\\n").slice(0, 3800);
      const output = await runRender(file, prompt);
      const nextPath = `${userId}/${data.id}/edit-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage.from("ambientes").upload(nextPath, output, {
        contentType: "image/png",
        upsert: false,
      });
      if (uploadError) throw new Error(`Falha ao salvar a nova versão: ${uploadError.message}`);

      const priorAnalysis = (p.analysis && typeof p.analysis === "object" ? p.analysis : {}) as Record<string, unknown>;
      const history = Array.isArray(priorAnalysis.render_history)
        ? (priorAnalysis.render_history as Array<{ path: string; created_at: string; instruction: string }>)
        : [];
      const nextHistory = [...history, { path: p.render_path, created_at: new Date().toISOString(), instruction: "Versão anterior ao ajuste" }].slice(-20);
      const { error: updateError } = await supabase
        .from("projects")
        .update({
          render_path: nextPath,
          render_status: "done",
          render_error: null,
          render_model: RENDER_MODEL,
          analysis: { ...priorAnalysis, render_history: nextHistory },
        })
        .eq("id", data.id);
      if (updateError) throw new Error(`A imagem foi gerada, mas não foi possível atualizar o projeto: ${updateError.message}`);
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Falha ao editar o render." };
    }
  });

const restoreRenderSchema = z.object({
  id: z.string().uuid(),
  path: z.string().min(1).max(500),
});

/** Restaura uma versão anterior sem gerar uma nova imagem nem consumir créditos de IA. */
export const restoreRenderVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => restoreRenderSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: p, error } = await supabase.from("projects").select("id, render_path, analysis").eq("id", data.id).single();
    if (error || !p) return { ok: false as const, error: "Projeto não encontrado." };
    if (!data.path.startsWith(`${userId}/${data.id}/`)) return { ok: false as const, error: "Versão inválida para este projeto." };
    const priorAnalysis = (p.analysis && typeof p.analysis === "object" ? p.analysis : {}) as Record<string, unknown>;
    const history = Array.isArray(priorAnalysis.render_history)
      ? (priorAnalysis.render_history as Array<{ path: string; created_at: string; instruction: string }>)
      : [];
    if (!history.some((v) => v.path === data.path)) return { ok: false as const, error: "Esta versão não está mais disponível no histórico." };
    const nextHistory = history.filter((v) => v.path !== data.path);
    if (p.render_path && p.render_path !== data.path) {
      nextHistory.push({ path: p.render_path, created_at: new Date().toISOString(), instruction: "Versão substituída ao restaurar outra" });
    }
    const { error: updateError } = await supabase
      .from("projects")
      .update({ render_path: data.path, render_status: "done", render_error: null, analysis: { ...priorAnalysis, render_history: nextHistory.slice(-20) } })
      .eq("id", data.id);
    if (updateError) return { ok: false as const, error: `Não foi possível restaurar a versão: ${updateError.message}` };
    return { ok: true as const };
  });


/** Guia de decoração por regras locais: sem chamada de IA, sem geração de imagem e sem créditos do provedor. */
export const getDecorationGuide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: p, error } = await supabase
      .from("projects")
      .select("id, title, description, style, analysis, render_path")
      .eq("id", data.id)
      .single();
    if (error || !p) return { ok: false as const, error: "Projeto não encontrado." };
    if (!p.render_path || !p.render_path.startsWith(`${userId}/${data.id}/`)) {
      return { ok: false as const, error: "Gere e salve um render deste projeto antes de pedir sugestões de decoração." };
    }
    return {
      ok: true as const,
      guide: buildDecorationGuide({
        title: p.title,
        description: p.description,
        style: p.style,
        analysis: p.analysis,
      }),
    };
  });
