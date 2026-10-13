import { createParser } from "eventsource-parser";

export const GATEWAY = "https://ai.gateway.lovable.dev";
export const VERCEL_AI_GATEWAY = "https://ai-gateway.vercel.sh";
export const ANALYSIS_MODEL = "alibaba/qwen3.7-flash";
export const RENDER_MODEL = "openai/gpt-image-2.5-sunburst";
const LEGACY_ANALYSIS_MODEL = "openai/gpt-6-astra";

type AiProviderConfig = { baseUrl: string; key: string; isVercel: boolean };

function getProviderConfig(): AiProviderConfig {
  const gatewayKey =
    process.env["AI_GATEWAY_API_KEY"] ||
    process.env["VERCEL_AI_GATEWAY_API_KEY"];
  const oidcToken = process.env["VERCEL_OIDC_TOKEN"];
  if (gatewayKey || oidcToken) {
    return {
      baseUrl: VERCEL_AI_GATEWAY,
      key: gatewayKey || oidcToken!,
      isVercel: true,
    };
  }

  const vercelRuntime = process.env["VERCEL"] === "1";
  const explicitlyVercel = process.env["AI_PROVIDER"]?.toLowerCase() === "vercel";
  if (vercelRuntime || explicitlyVercel) {
    throw new AiError(500, "A publicação está configurada para usar o AI Gateway da Vercel, mas não há AI_GATEWAY_API_KEY, VERCEL_AI_GATEWAY_API_KEY nem VERCEL_OIDC_TOKEN disponíveis no servidor.");
  }

  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new AiError(500, "Nenhuma credencial de IA está configurada no servidor.");
  return { baseUrl: GATEWAY, key, isVercel: false };
}

export class AiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function friendlyStatus(status: number, raw: string): string {
  let msg = raw;
  try {
    const j = JSON.parse(raw);
    msg = j?.error?.message ?? j?.message ?? raw;
  } catch {
    /* texto puro */
  }
  msg = String(msg).slice(0, 300);
  switch (status) {
    case 401:
      return "Credencial de IA inválida ou ausente no servidor. Confira a variável do provedor configurado.";
    case 402:
      return `Créditos de IA insuficientes no workspace. ${msg}`;
    case 403:
      return `Acesso ao modelo negado: ${msg}`;
    case 429:
      return "Limite de requisições atingido. Aguarde alguns segundos e tente novamente.";
    default:
      return `Erro do provedor de IA (${status}): ${msg}`;
  }
}

export function getKey(): string {
  return getProviderConfig().key;
}

export const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "ambiente",
    "elementos_existentes",
    "restricoes",
    "proposta",
    "estimativas_visuais",
    "pendencias",
    "riscos",
    "prompt_render",
  ],
  properties: {
    ambiente: {
      type: "object",
      additionalProperties: false,
      required: ["tipo", "descricao", "iluminacao"],
      properties: { tipo: { type: "string" }, descricao: { type: "string" }, iluminacao: { type: "string" } },
    },
    elementos_existentes: { type: "array", items: { type: "string" } },
    restricoes: { type: "array", items: { type: "string" } },
    proposta: {
      type: "object",
      additionalProperties: false,
      required: ["resumo", "superiores", "inferiores", "materiais", "ferragens"],
      properties: {
        resumo: { type: "string" },
        superiores: { type: "string" },
        inferiores: { type: "string" },
        materiais: { type: "array", items: { type: "string" } },
        ferragens: { type: "array", items: { type: "string" } },
      },
    },
    estimativas_visuais: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["item", "faixa", "justificativa"],
        properties: { item: { type: "string" }, faixa: { type: "string" }, justificativa: { type: "string" } },
      },
    },
    pendencias: { type: "array", items: { type: "string" } },
    riscos: { type: "array", items: { type: "string" } },
    prompt_render: { type: "string" },
  },
} as const;

export const ANALYSIS_INSTRUCTIONS = `Você é um projetista de marcenaria sênior no Brasil. Analise a foto real do ambiente e o pedido do cliente.
REGRAS OBRIGATÓRIAS:
- Nunca afirme medidas exatas a partir da foto. Fotos não têm escala confiável.
- Em "estimativas_visuais", dê somente FAIXAS aproximadas (ex.: "220–260 cm") e a referência visual usada (porta padrão, azulejo, tomada). Use o campo "item" no formato "Superiores largura", "Superiores altura", "Superiores profundidade", "Inferiores largura", "Inferiores altura", "Inferiores profundidade" ou outro item do ambiente. Não estime itens que o cliente já informou.
- Liste em "pendencias" todas as medidas e decisões que precisam ser confirmadas em visita técnica.
- Medidas informadas pelo cliente são a verdade; respeite-as.
- "prompt_render": instrução em inglês para um modelo de edição de imagem adicionar os armários na MESMA foto, preservando paredes, janelas, piso, perspectiva e luz, sem texto ou cotas na imagem.
Responda em português brasileiro (exceto prompt_render).`;

/** Chama /v1/responses em streaming e devolve o JSON final. */
export async function runAnalysis(userText: string, imageDataUrl: string) {
  const provider = getProviderConfig();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${provider.key}`,
    "Content-Type": "application/json",
  };
  if (!provider.isVercel) headers["X-Lovable-AIG-SDK"] = "fetch";
  const res = await fetch(`${provider.baseUrl}/v1/responses`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: provider.isVercel ? ANALYSIS_MODEL : LEGACY_ANALYSIS_MODEL,
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions: ANALYSIS_INSTRUCTIONS,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: userText },
            { type: "input_image", image_url: imageDataUrl },
          ],
        },
      ],
      text: { format: { type: "json_schema", name: "analise_marcenaria", strict: true, schema: ANALYSIS_SCHEMA } },
    }),
  });
  if (!res.ok || !res.body) throw new AiError(res.status, friendlyStatus(res.status, await res.text().catch(() => "")));

  let text = "";
  let failure: string | null = null;
  let refused = false;
  const parser = createParser({
    onEvent(ev) {
      let p: any;
      try {
        p = JSON.parse(ev.data);
      } catch {
        return;
      }
      const type = ev.event || p?.type;
      if (type === "response.output_text.delta") text += p.delta ?? "";
      else if (type === "response.refusal.delta") refused = true;
      else if (type === "response.failed" || type === "error")
        failure = p?.response?.error?.message ?? p?.error?.message ?? p?.message ?? "Falha na análise";
    },
  });
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.feed(value);
  }
  if (refused) throw new AiError(400, "O modelo recusou analisar esta imagem.");
  if (failure) throw new AiError(502, failure);
  if (!text.trim()) throw new AiError(502, "A análise retornou vazia.");
  try {
    return JSON.parse(text);
  } catch {
    throw new AiError(502, "A análise não retornou JSON válido.");
  }
}

/** Edita a foto real via /v1/images/edits (streaming) e devolve PNG em bytes. */
export async function runRender(image: File, prompt: string): Promise<Uint8Array> {
  const provider = getProviderConfig();
  const send = (stream: boolean) => {
    const form = new FormData();
    form.set("model", RENDER_MODEL);
    form.set("prompt", prompt);
    form.append("image", image);
    if (provider.isVercel) form.set("response_format", "b64_json");
    if (stream) {
      form.set("stream", "true");
      form.set("partial_images", "1");
    }
    const headers: Record<string, string> = { Authorization: `Bearer ${provider.key}` };
    if (!provider.isVercel) headers["X-Lovable-AIG-SDK"] = "fetch";
    return fetch(`${provider.baseUrl}/v1/images/edits`, {
      method: "POST",
      headers,
      body: form,
    });
  };

  if (provider.isVercel) {
    // Vercel AI Gateway /v1/images/edits accepts JSON with an images array,
    // not the OpenAI multipart/form-data shape used by the legacy Lovable gateway.
    const inputBytes = new Uint8Array(await image.arrayBuffer());
    const inputDataUrl = bytesToDataUrl(inputBytes, image.type || "image/jpeg");
    const response = await fetch(`${provider.baseUrl}/v1/images/edits`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: RENDER_MODEL,
        prompt,
        images: [{ image_url: inputDataUrl }],
      }),
    });
    if (!response.ok) throw new AiError(response.status, friendlyStatus(response.status, await response.text().catch(() => "")));
    const payload = (await response.json()) as { data?: { b64_json?: string }[] };
    const final = payload.data?.[0]?.b64_json;
    if (!final) throw new AiError(502, "O AI Gateway da Vercel não devolveu a imagem em base64.");
    const bin = atob(final);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  const res = await send(true);
  if (!res.ok || !res.body) throw new AiError(res.status, friendlyStatus(res.status, await res.text().catch(() => "")));

  let final: string | null = null;
  let sawEvent = false;
  let err: string | null = null;
  const parser = createParser({
    onEvent(ev) {
      let p: any;
      try {
        p = JSON.parse(ev.data);
      } catch {
        return;
      }
      const type = ev.event || p?.type;
      if (type === "error" || p?.type === "error") {
        sawEvent = true;
        err = p?.error?.message ?? "Falha na geração da imagem";
        return;
      }
      if (type === "image_edit.partial_image" || type === "image_generation.partial_image") sawEvent = true;
      if (type === "image_edit.completed" || type === "image_generation.completed") {
        sawEvent = true;
        final = p?.b64_json ?? null;
      }
    },
  });
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.feed(value);
  }
  if (err) throw new AiError(502, err);
  // Some gateways emit partial-image events but omit the final completion event.
  // In that case, retry once without streaming instead of failing despite a valid response.
  if (!final) {
    const replay = await send(false);
    if (!replay.ok) throw new AiError(replay.status, friendlyStatus(replay.status, await replay.text().catch(() => "")));
    const j = (await replay.json()) as { data?: { b64_json?: string }[] };
    final = j.data?.[0]?.b64_json ?? null;
  }
  if (!final) throw new AiError(502, "O provedor não devolveu a imagem final.");
  const bin = atob(final);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToDataUrl(bytes: Uint8Array, mime: string) {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return `data:${mime};base64,${btoa(s)}`;
}
