// Regras de medidas: nunca inventar valores exatos a partir da foto.
// Valores digitados pelo usuário = "informada"; leituras visuais da IA = "estimada"
// (sempre texto/faixa, nunca substituem); campos sem dado = "pendente".

export type CabinetInput = {
  largura_cm?: number | null;
  altura_cm?: number | null;
  profundidade_cm?: number | null;
  modulos?: number | null;
  observacoes?: string;
};

export type DimensionStatus = "informada" | "estimada" | "pendente";

export type DimensionRow = {
  grupo: "Superiores" | "Inferiores";
  campo: string;
  valor: string;
  status: DimensionStatus;
};

export type VisualEstimate = { item: string; faixa: string; justificativa: string };

export const FIELDS: { key: keyof CabinetInput; label: string; unit: string; max: number }[] = [
  { key: "largura_cm", label: "Largura total", unit: "cm", max: 2000 },
  { key: "altura_cm", label: "Altura", unit: "cm", max: 400 },
  { key: "profundidade_cm", label: "Profundidade", unit: "cm", max: 150 },
  { key: "modulos", label: "Nº de módulos", unit: "", max: 60 },
];

/** Converte texto do formulário em número válido ou null. Rejeita negativos, zero e acima do limite. */
export function parseMeasure(raw: string, max: number): number | null {
  const t = raw.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0 || n > max) return null;
  return Math.round(n * 10) / 10;
}

export function sanitizeCabinet(input: unknown): CabinetInput {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const out: CabinetInput = {};
  for (const f of FIELDS) {
    const v = src[f.key];
    const n = typeof v === "number" ? v : typeof v === "string" ? parseMeasure(v, f.max) : null;
    (out as Record<string, unknown>)[f.key] = n != null && n > 0 && n <= f.max ? n : null;
  }
  const obsRaw = src["observacoes"];
  out.observacoes = typeof obsRaw === "string" ? obsRaw.slice(0, 500) : "";
  return out;
}

function matchEstimate(estimates: VisualEstimate[], grupo: string, label: string) {
  const g = grupo.toLowerCase().slice(0, 8); // "superior" / "inferior"
  const l = label.toLowerCase().split(" ")[0] ?? "";
  return estimates.find((e) => {
    const i = (e.item ?? "").toLowerCase();
    return i.includes(g) && i.includes(l);
  });
}

/** Consolida medidas: informada (usuário) > estimada (IA, faixa textual) > pendente. */
export function consolidateDimensions(
  upper: CabinetInput,
  lower: CabinetInput,
  estimates: VisualEstimate[] = [],
): DimensionRow[] {
  const rows: DimensionRow[] = [];
  const groups: [DimensionRow["grupo"], CabinetInput][] = [
    ["Superiores", upper],
    ["Inferiores", lower],
  ];
  for (const [grupo, data] of groups) {
    for (const f of FIELDS) {
      const v = data[f.key];
      if (typeof v === "number" && v > 0) {
        rows.push({ grupo, campo: f.label, valor: `${v}${f.unit ? " " + f.unit : ""}`, status: "informada" });
        continue;
      }
      const est = matchEstimate(estimates, grupo, f.label);
      if (est) {
        rows.push({ grupo, campo: f.label, valor: `≈ ${est.faixa} (visual)`, status: "estimada" });
      } else {
        rows.push({ grupo, campo: f.label, valor: "—", status: "pendente" });
      }
    }
  }
  return rows;
}

export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validateUploadMeta(type: string, size: number): string | null {
  if (!(ALLOWED_MIME as readonly string[]).includes(type)) return "Formato não suportado. Use JPG, PNG ou WEBP.";
  if (size <= 0) return "Arquivo vazio.";
  if (size > MAX_UPLOAD_BYTES) return "Arquivo acima de 10 MB.";
  return null;
}

/** Confere a assinatura binária real do arquivo (não confia só na extensão). */
export function sniffImageType(bytes: Uint8Array): (typeof ALLOWED_MIME)[number] | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") return "image/webp";
  return null;
}
