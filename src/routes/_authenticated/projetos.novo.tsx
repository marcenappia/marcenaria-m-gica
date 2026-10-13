import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Camera, Images, Loader2, Sparkles, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FIELDS, parseMeasure, validateUploadMeta, type CabinetInput } from "@/lib/cabinets";
import { analyzeProject, renderProject } from "@/lib/projects.functions";

export const Route = createFileRoute("/_authenticated/projetos/novo")({
  head: () => ({ meta: [
    { title: "Novo projeto — Marcenaria Mágica" },
    { name: "description", content: "Da foto do cliente ao render de marcenaria, em um fluxo rápido." },
    { property: "og:title", content: "Novo projeto — Marcenaria Mágica" },
    { property: "og:description", content: "Da foto do cliente ao render de marcenaria, em um fluxo rápido." },
  ] }),
  component: Novo,
});

type Raw = Record<string, string>;
type Stage = "idle" | "saving" | "analyzing" | "rendering";

function toCabinet(raw: Raw): CabinetInput {
  const c: CabinetInput = { observacoes: (raw["observacoes"] ?? "").slice(0, 500) };
  for (const f of FIELDS) (c as any)[f.key] = parseMeasure(raw[f.key] ?? "", f.max);
  return c;
}

function CabinetFields({ title, value, onChange }: { title: string; value: Raw; onChange: (v: Raw) => void }) {
  return <fieldset className="space-y-3 rounded-lg border bg-card p-4">
    <legend className="px-1 font-display text-lg">{title}</legend>
    <p className="text-xs text-muted-foreground">Informe somente medidas conferidas. O que ficar em branco será tratado como pendente.</p>
    <div className="grid grid-cols-2 gap-3">{FIELDS.map((f) => <div key={f.key} className="space-y-1">
      <Label className="text-xs">{f.label}{f.unit && ` (${f.unit})`}</Label>
      <Input inputMode="decimal" value={value[f.key] ?? ""} onChange={(e) => onChange({ ...value, [f.key]: e.target.value })} />
    </div>)}</div>
    <div className="space-y-1"><Label className="text-xs">Observações técnicas</Label><Input value={value["observacoes"] ?? ""} onChange={(e) => onChange({ ...value, observacoes: e.target.value })} /></div>
  </fieldset>;
}

function Novo() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const analyze = useServerFn(analyzeProject);
  const render = useServerFn(renderProject);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("");
  const [environment, setEnvironment] = useState("");
  const [modules, setModules] = useState<string[]>([]);
  const [upper, setUpper] = useState<Raw>({});
  const [lower, setLower] = useState<Raw>({});
  const [stage, setStage] = useState<Stage>("idle");
  const busy = stage !== "idle";
  const catalog: Record<string, { id: string; label: string }[]> = {
    cozinha: [{id:"inferiores",label:"Armários inferiores"},{id:"superiores",label:"Armários superiores"},{id:"torre-quente",label:"Torre quente"},{id:"despenseiro",label:"Despenseiro"},{id:"gaveteiro",label:"Gaveteiro"},{id:"bancada",label:"Bancada"},{id:"ilha",label:"Ilha"},{id:"peninsula",label:"Península"},{id:"nicho",label:"Nichos"},{id:"cristaleira",label:"Cristaleira"}],
    sala: [{id:"painel-tv",label:"Painel de TV"},{id:"rack",label:"Rack"},{id:"estante",label:"Estante"},{id:"prateleiras",label:"Prateleiras"},{id:"bar",label:"Bar"},{id:"cristaleira",label:"Cristaleira"}],
    quarto: [{id:"roupeiro",label:"Roupeiro"},{id:"portas-correr",label:"Portas de correr"},{id:"maleiro",label:"Maleiro"},{id:"gaveteiro",label:"Gaveteiro"},{id:"cabeceira",label:"Cabeceira"}],
    closet: [{id:"roupeiro",label:"Módulos de roupeiro"},{id:"cabideiro",label:"Cabideiros"},{id:"gaveteiro",label:"Gaveteiros"},{id:"sapateira",label:"Sapateira"},{id:"maleiro",label:"Maleiro"}],
    banheiro: [{id:"gabinete",label:"Gabinete"},{id:"espelheira",label:"Espelheira"},{id:"nicho",label:"Nicho"},{id:"armario-alto",label:"Armário alto"}],
    lavanderia: [{id:"armario-inferior",label:"Armário inferior"},{id:"armario-superior",label:"Armário superior"},{id:"torre-lavanderia",label:"Torre para máquinas"},{id:"bancada",label:"Bancada"},{id:"vassoureiro",label:"Vassoureiro"}],
    gourmet: [{id:"armario-inferior",label:"Armário inferior"},{id:"armario-superior",label:"Armário superior"},{id:"bancada",label:"Bancada"},{id:"ilha",label:"Ilha gourmet"},{id:"nicho",label:"Nichos"}],
    comercial: [{id:"recepcao",label:"Balcão de recepção"},{id:"expositor",label:"Expositores"},{id:"armario",label:"Armários"},{id:"bancada",label:"Bancada de atendimento"}],
    outro: [{id:"modulo-personalizado",label:"Módulo personalizado"},{id:"armario",label:"Armário"},{id:"bancada",label:"Bancada"},{id:"nicho",label:"Nichos"}],
  };
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
    if (!file) { toast.error("Tire uma foto ou escolha a foto do ambiente."); return; }
    if (description.trim().length < 8) { toast.error("Conte um pouco mais sobre o que o cliente quer."); return; }
    for (const [raw, name] of [[upper, "superiores"], [lower, "inferiores"]] as const) {
      for (const f of FIELDS) {
        const v = raw[f.key];
        if (v && parseMeasure(v, f.max) == null) { toast.error(`${f.label} (${name}) inválida.`); return; }
      }
    }

    setStage("saving");
    let projectId: string | null = null;
    try {
      const chosenModules = modules.map((id) => catalog[environment]?.find((m) => m.id === id)?.label ?? id);
      const projectDescription = [
        description.trim(),
        `AMBIENTE: ${environment || "não especificado; interpretar a partir da foto e do pedido"}.`,
        `MÓDULOS SOLICITADOS: ${chosenModules.join(", ") || "a definir"}.`,
        "REGRA VISUAL: editar a foto original, preservar arquitetura, paredes, portas, janelas, piso, teto, iluminação e perspectiva. Alterar somente o que foi pedido. Não inventar medidas exatas.",
      ].join("\n\n");
      const { data: proj, error } = await supabase.from("projects").insert({
        title: title.trim() || `Projeto ${new Date().toLocaleDateString("pt-BR")}`,
        description: projectDescription, style,
        upper_cabinets: toCabinet(upper) as any, lower_cabinets: toCabinet(lower) as any, user_id: user.id,
      }).select("id").single();
      if (error) throw error;
      projectId = proj.id;

      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/${proj.id}/original.${ext}`;
      const up = await supabase.storage.from("ambientes").upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const upd = await supabase.from("projects").update({ original_path: path }).eq("id", proj.id);
      if (upd.error) throw upd.error;

      setStage("analyzing");
      const analysisResult = await analyze({ data: { id: proj.id } });
      if (!analysisResult.ok) {
        toast.error(`Projeto salvo. A análise não concluiu: ${analysisResult.error}`);
        await navigate({ to: "/projetos/$id", params: { id: proj.id } });
        return;
      }

      setStage("rendering");
      const renderResult = await render({ data: { id: proj.id } });
      if (!renderResult.ok) {
        toast.error(`Análise salva. O render precisa ser tentado novamente: ${renderResult.error}`);
        await navigate({ to: "/projetos/$id", params: { id: proj.id } });
        return;
      }
      toast.success("Render gerado e salvo. Agora você pode pedir ajustes sem perder esta versão.");
      await navigate({ to: "/projetos/$id", params: { id: proj.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir o projeto.");
      if (projectId) await navigate({ to: "/projetos/$id", params: { id: projectId } });
      else setStage("idle");
    }
  }

  const stageLabel = stage === "saving" ? "Salvando foto e projeto…" : stage === "analyzing" ? "Magic está entendendo o ambiente…" : stage === "rendering" ? "Gerando e salvando o render…" : "Gerar render do ambiente";

  return <form onSubmit={submit} className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><span className="eyebrow">Estúdio rápido · Marcenaria Mágica</span><h1 className="mt-2 text-3xl sm:text-4xl">Da foto ao render</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Atenda o cliente sem perder horas montando uma cena. Envie a foto real, descreva o móvel e gere a primeira proposta. Sem construir paredes nem montar um ambiente 3D do zero.</p>
      </div>
      <div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-2 text-sm text-muted-foreground sm:flex"><Sparkles className="size-4 text-primary" /> Fluxo rápido</div>
    </div>
    <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_1fr]">
      <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex items-center gap-2"><Camera className="size-5 text-primary" /><h2 className="text-xl font-semibold">1. Foto do cliente</h2></div>
        <div className="wood-grain flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-muted/40">
          {preview ? <img src={preview} alt="Prévia da foto original do ambiente" className="h-full w-full object-contain" /> : <div className="max-w-sm px-5 text-center"><Images className="mx-auto size-9 text-muted-foreground" /><p className="mt-3 font-medium">A foto original será preservada</p><p className="mt-1 text-sm text-muted-foreground">Tire a foto na hora pelo celular ou selecione uma imagem. O render será salvo separadamente.</p></div>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground hover:opacity-90"><Camera className="size-4" /> Tirar foto<input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { pick(e.target.files?.[0]); e.currentTarget.value = ""; }} /></label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-sm font-semibold hover:bg-muted"><Images className="size-4" /> Escolher imagem<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { pick(e.target.files?.[0]); e.currentTarget.value = ""; }} /></label>
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP · até 10 MB. A imagem enviada é a base do render.</p>
      </section>
      <section className="space-y-5 rounded-xl border bg-card p-4 sm:p-5">
        <div><span className="eyebrow">2. Briefing</span><h2 className="mt-1 text-xl font-semibold">O que vamos criar?</h2><p className="mt-1 text-sm text-muted-foreground">Escreva como explicaria para outro projetista. As medidas são opcionais nesta primeira etapa.</p></div>
        <div className="space-y-1"><Label htmlFor="project-title">Nome do projeto (opcional)</Label><Input id="project-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cozinha da cliente — apartamento" /></div>
        <div className="space-y-1"><Label htmlFor="project-description">Pedido do cliente</Label><Textarea id="project-description" rows={6} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Quero uma cozinha em L, MDF carvalho claro com partes off-white, torre quente à esquerda, geladeira à direita e gaveteiros sob a bancada. Preserve a pedra e os revestimentos. A parede tem 2,80 m de largura…" /></div>
        <details className="rounded-lg border px-4 py-3">
          <summary className="cursor-pointer select-none text-sm font-semibold">Ajustes técnicos opcionais · ambiente, módulos e medidas</summary>
          <div className="mt-4 space-y-4">
            <div className="space-y-1"><Label htmlFor="environment">Tipo de ambiente</Label><select id="environment" value={environment} onChange={(e) => { setEnvironment(e.target.value); setModules([]); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Não informar agora</option><option value="cozinha">Cozinha</option><option value="sala">Sala / living</option><option value="quarto">Quarto</option><option value="closet">Closet</option><option value="banheiro">Banheiro / lavabo</option><option value="lavanderia">Lavanderia</option><option value="gourmet">Churrasqueira / Gourmet</option><option value="comercial">Comercial</option><option value="outro">Outro ambiente</option></select></div>
            <fieldset className="space-y-2 rounded-lg border bg-card p-4"><legend className="px-1 font-medium">Módulos desejados</legend><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{(catalog[environment] ?? catalog.outro).map((m) => <label key={m.id} className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={modules.includes(m.id)} onChange={(e) => setModules((old) => e.target.checked ? [...old, m.id] : old.filter((id) => id !== m.id))} />{m.label}</label>)}</div></fieldset>
            <div className="space-y-1"><Label htmlFor="project-style">Estilo / acabamento (opcional)</Label><Input id="project-style" value={style} onChange={(e) => setStyle(e.target.value)} placeholder="MDF freijó + laca off-white" /></div>
            <CabinetFields title="Armários superiores" value={upper} onChange={setUpper} /><CabinetFields title="Armários inferiores" value={lower} onChange={setLower} />
          </div>
        </details>
        <Button type="submit" className="w-full min-h-12 text-base" disabled={busy || !file || description.trim().length < 8}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}{stageLabel}
        </Button>
        {busy && <p className="text-sm text-muted-foreground" role="status" aria-live="polite">Não feche esta página. O projeto será salvo mesmo se a análise ou o render falhar; nesse caso abriremos a tela para tentar novamente.</p>}
        <p className="text-xs text-muted-foreground">A IA pode errar detalhes visuais. Medidas e ferragens precisam ser conferidas antes de fabricar.</p>
      </section>
    </div>
  </form>;
}
