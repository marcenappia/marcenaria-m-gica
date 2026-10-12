import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FIELDS, parseMeasure, validateUploadMeta, type CabinetInput } from "@/lib/cabinets";

export const Route = createFileRoute("/_authenticated/projetos/novo")({
  head: () => ({
    meta: [
      { title: "Novo projeto — Oficina IA" },
      { name: "description", content: "Envie a foto do ambiente, descreva a marcenaria e informe as medidas." },
      { property: "og:title", content: "Novo projeto — Oficina IA" },
      { property: "og:description", content: "Envie a foto do ambiente, descreva a marcenaria e informe as medidas." },
    ],
  }),
  component: Novo,
});

type Raw = Record<string, string>;

function toCabinet(raw: Raw): CabinetInput {
  const c: CabinetInput = { observacoes: (raw.observacoes ?? "").slice(0, 500) };
  for (const f of FIELDS) (c as any)[f.key] = parseMeasure(raw[f.key] ?? "", f.max);
  return c;
}

function CabinetFields({ title, value, onChange }: { title: string; value: Raw; onChange: (v: Raw) => void }) {
  return (
    <fieldset className="space-y-3 rounded-lg border bg-card p-4">
      <legend className="px-1 font-display text-lg">{title}</legend>
      <p className="text-xs text-muted-foreground">Deixe em branco o que não foi medido — ficará como pendente.</p>
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label className="text-xs">{f.label}{f.unit && ` (${f.unit})`}</Label>
            <Input inputMode="decimal" value={value[f.key] ?? ""} onChange={(e) => onChange({ ...value, [f.key]: e.target.value })} />
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Observações</Label>
        <Input value={value.observacoes ?? ""} onChange={(e) => onChange({ ...value, observacoes: e.target.value })} />
      </div>
    </fieldset>
  );
}

function Novo() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("");
  const [upper, setUpper] = useState<Raw>({});
  const [lower, setLower] = useState<Raw>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function pick(f: File | undefined) {
    if (!f) return;
    const err = validateUploadMeta(f.type, f.size);
    if (err) return toast.error(err);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("Envie a foto do ambiente.");
    for (const [raw, name] of [[upper, "superiores"], [lower, "inferiores"]] as const) {
      for (const f of FIELDS) {
        const v = raw[f.key];
        if (v && parseMeasure(v, f.max) == null) return toast.error(`${f.label} (${name}) inválida.`);
      }
    }
    setBusy(true);
    try {
      const { data: proj, error } = await supabase
        .from("projects")
        .insert({ title: title.trim() || "Projeto sem título", description, style, upper_cabinets: toCabinet(upper) as any, lower_cabinets: toCabinet(lower) as any, user_id: user.id })
        .select("id")
        .single();
      if (error) throw error;
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/${proj.id}/original.${ext}`;
      const up = await supabase.storage.from("ambientes").upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const upd = await supabase.from("projects").update({ original_path: path }).eq("id", proj.id);
      if (upd.error) throw upd.error;
      navigate({ to: "/projetos/$id", params: { id: proj.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-4">
        <span className="eyebrow">Etapa 1</span>
        <h1 className="text-3xl">Foto real do ambiente</h1>
        <label className="wood-grain flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-card">
          {preview ? <img src={preview} alt="Prévia" className="h-full w-full object-contain" /> : <span className="text-sm text-muted-foreground">Clique para enviar JPG, PNG ou WEBP (até 10 MB)</span>}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
      </div>
      <div className="space-y-5">
        <span className="eyebrow">Etapa 2</span>
        <h2 className="text-3xl">Pedido e medidas</h2>
        <div className="space-y-1"><Label>Nome do projeto</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cozinha — Apto 302" /></div>
        <div className="space-y-1"><Label>Descreva a marcenaria</Label><Textarea rows={4} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Armários em L com torre quente, puxador cava…" /></div>
        <div className="space-y-1"><Label>Estilo / acabamento</Label><Input value={style} onChange={(e) => setStyle(e.target.value)} placeholder="MDF freijó + laca off-white" /></div>
        <CabinetFields title="Armários superiores" value={upper} onChange={setUpper} />
        <CabinetFields title="Armários inferiores" value={lower} onChange={setLower} />
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Salvando foto e projeto…" : "Salvar projeto"}</Button>
      </div>
    </form>
  );
}
