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
  const c: CabinetInput = { observacoes: (raw["observacoes"] ?? "").slice(0, 500) };
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
        <Input value={value["observacoes"] ?? ""} onChange={(e) => onChange({ ...value, observacoes: e.target.value })} />
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
  const [environment, setEnvironment] = useState("cozinha");
  const [modules, setModules] = useState<string[]>(["inferiores", "superiores"]);
  const catalog: Record<string, { id: string; label: string }[]> = {
    cozinha: [{id:"inferiores",label:"Armários inferiores"},{id:"superiores",label:"Armários superiores"},{id:"torre-quente",label:"Torre quente"},{id:"despenseiro",label:"Despenseiro"},{id:"gaveteiro",label:"Gaveteiro"},{id:"bancada",label:"Bancada"},{id:"ilha",label:"Ilha"},{id:"peninsula",label:"Península"},{id:"nicho",label:"Nichos"},{id:"cristaleira",label:"Cristaleira"}],
    sala: [{id:"painel-tv",label:"Painel de TV"},{id:"rack",label:"Rack"},{id:"estante",label:"Estante"},{id:"prateleiras",label:"Prateleiras"},{id:"bar",label:"Bar"},{id:"cristaleira",label:"Cristaleira"}], quarto: [{id:"roupeiro",label:"Roupeiro"},{id:"portas-correr",label:"Portas de correr"},{id:"maleiro",label:"Maleiro"},{id:"gaveteiro",label:"Gaveteiro"},{id:"cabeceira",label:"Cabeceira"}], closet: [{id:"roupeiro",label:"Módulos de roupeiro"},{id:"cabideiro",label:"Cabideiros"},{id:"gaveteiro",label:"Gaveteiros"},{id:"sapateira",label:"Sapateira"},{id:"maleiro",label:"Maleiro"}], banheiro: [{id:"gabinete",label:"Gabinete"},{id:"espelheira",label:"Espelheira"},{id:"nicho",label:"Nicho"},{id:"armario-alto",label:"Armário alto"}], lavanderia: [{id:"armario-inferior",label:"Armário inferior"},{id:"armario-superior",label:"Armário superior"},{id:"torre-lavanderia",label:"Torre para máquinas"},{id:"bancada",label:"Bancada"},{id:"vassoureiro",label:"Vassoureiro"}], gourmet: [{id:"armario-inferior",label:"Armário inferior"},{id:"armario-superior",label:"Armário superior"},{id:"bancada",label:"Bancada"},{id:"ilha",label:"Ilha gourmet"},{id:"nicho",label:"Nichos"}], comercial: [{id:"recepcao",label:"Balcão de recepção"},{id:"expositor",label:"Expositores"},{id:"armario",label:"Armários"},{id:"bancada",label:"Bancada de atendimento"}], outro: [{id:"modulo-personalizado",label:"Módulo personalizado"},{id:"armario",label:"Armário"},{id:"bancada",label:"Bancada"},{id:"nicho",label:"Nicho"}]
  };
  const [upper, setUpper] = useState<Raw>({});
  const [lower, setLower] = useState<Raw>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function pick(f: File | undefined) {
    if (!f) return;
    const err = validateUploadMeta(f.type, f.size);
    if (err) { toast.error(err); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { toast.error("Envie a foto do ambiente."); return; }
    for (const [raw, name] of [[upper, "superiores"], [lower, "inferiores"]] as const) {
      for (const f of FIELDS) {
        const v = raw[f.key];
        if (v && parseMeasure(v, f.max) == null) { toast.error(`${f.label} (${name}) inválida.`); return; }
      }
    }
    setBusy(true);
    try {
      const { data: proj, error } = await supabase
        .from("projects")
        .insert({ title: title.trim() || "Projeto sem título", description: `${description.trim()}\n\nAMBIENTE: ${environment}.\nMÓDULOS SOLICITADOS: ${modules.map((id) => catalog[environment]?.find((m) => m.id === id)?.label ?? id).join(", ") || "a definir"}.\nREGRA VISUAL: preservar paredes, portas, janelas, piso, teto, iluminação e perspectiva da foto; alterar somente a marcenaria descrita. Não inventar medidas que não foram informadas.`, style, upper_cabinets: toCabinet(upper) as any, lower_cabinets: toCabinet(lower) as any, user_id: user.id })
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
        <div className="space-y-1"><Label>Ambiente</Label><select value={environment} onChange={(e) => { setEnvironment(e.target.value); setModules([]); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="cozinha">Cozinha</option><option value="sala">Sala / living</option><option value="quarto">Quarto</option><option value="closet">Closet</option><option value="banheiro">Banheiro / lavabo</option><option value="lavanderia">Lavanderia</option><option value="gourmet">Churrasqueira / Gourmet</option><option value="comercial">Comercial</option><option value="outro">Outro ambiente</option></select></div>\n        <fieldset className="space-y-2 rounded-lg border bg-card p-4"><legend className="px-1 font-medium">Módulos desejados</legend><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{(catalog[environment] ?? catalog.outro).map((m) => <label key={m.id} className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={modules.includes(m.id)} onChange={(e) => setModules((old) => e.target.checked ? [...old, m.id] : old.filter((id) => id !== m.id))} />{m.label}</label>)}</div><p className="text-xs text-muted-foreground">As escolhas ficam registradas no briefing que orienta o projeto.</p></fieldset>\n        <div className="space-y-1"><Label>Estilo / acabamento</Label><Input value={style} onChange={(e) => setStyle(e.target.value)} placeholder="MDF freijó + laca off-white" /></div>
        <CabinetFields title="Armários superiores" value={upper} onChange={setUpper} />
        <CabinetFields title="Armários inferiores" value={lower} onChange={setLower} />
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Salvando foto e projeto…" : "Salvar projeto"}</Button>
      </div>
    </form>
  );
}
