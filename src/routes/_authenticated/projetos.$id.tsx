import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, RotateCcw, FileDown, Sparkles, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analyzeProject, renderProject, editRender, restoreRenderVersion, getDecorationGuide } from "@/lib/projects.functions";
import type { DecorationGuide } from "@/lib/design-skills";
import { consolidateDimensions, sanitizeCabinet } from "@/lib/cabinets";
import { useSignedUrl, type Project } from "@/lib/storage";
import { exportPdf } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/projetos/$id")({
  head: () => ({
    meta: [
      { title: "Projeto — Oficina IA" },
      { name: "description", content: "Análise estruturada, medidas e render do projeto de marcenaria." },
      { property: "og:title", content: "Projeto — Oficina IA" },
      { property: "og:description", content: "Análise estruturada, medidas e render do projeto de marcenaria." },
    ],
  }),
  component: Detalhe,
});

const statusStyle = { informada: "bg-success text-primary-foreground", estimada: "bg-warning text-foreground", pendente: "bg-muted text-muted-foreground" };

function Detalhe() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const analyze = useServerFn(analyzeProject);
  const render = useServerFn(renderProject);
  const edit = useServerFn(editRender);
  const restore = useServerFn(restoreRenderVersion);
  const decorate = useServerFn(getDecorationGuide);
  const [decorationGuide, setDecorationGuide] = useState<DecorationGuide | null>(null);
  const [editInstruction, setEditInstruction] = useState("");
  const [viewer, setViewer] = useState<{src:string;title:string}|null>(null);
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState<"a" | "r" | "e" | "restore" | null>(null);
  const q = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Project;
    },
  });
  const orig = useSignedUrl(q.data?.original_path);
  const rend = useSignedUrl(q.data?.render_path);

  if (q.isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  if (q.error || !q.data) return <p className="text-destructive">Projeto não encontrado.</p>;
  const p = q.data;
  const rows = consolidateDimensions(sanitizeCabinet(p.upper_cabinets), sanitizeCabinet(p.lower_cabinets), p.analysis?.estimativas_visuais ?? []);

  async function run(kind: "a" | "r") {
    setBusy(kind);
    try {
      const res = kind === "a" ? await analyze({ data: { id } }) : await render({ data: { id } });
      if (res.ok) toast.success(kind === "a" ? "Análise concluída" : "Render gerado e salvo");
      else toast.error(res.error);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha");
    } finally {
      setBusy(null);
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    }
  }

  const a = p.analysis;
  const renderHistory = ((p.analysis as unknown as { render_history?: Array<{ path: string; created_at: string; instruction: string }> } | null)?.render_history ?? []);
  async function runEdit() {
    if (editInstruction.trim().length < 3) {
      toast.error("Descreva a alteração que deseja fazer.");
      return;
    }
    setBusy("e");
    try {
      const res = await edit({ data: { id, instruction: editInstruction.trim() } });
      if (res.ok) {
        toast.success("Nova versão criada; a imagem anterior ficou salva no histórico.");
        setEditInstruction("");
      } else {
        toast.error(res.error);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível editar o render.");
    } finally {
      setBusy(null);
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    }
  }
  async function runRestore(path: string) {
    setBusy("restore");
    try {
      const res = await restore({ data: { id, path } });
      if (res.ok) toast.success("Versão restaurada sem gerar outra imagem.");
      else toast.error(res.error);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível restaurar a versão.");
    } finally {
      setBusy(null);
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    }
  }

  async function runDecorationGuide() {
    try {
      const res = await decorate({ data: { id } });
      if (res.ok) {
        setDecorationGuide(res.guide);
        toast.success("Guia de decoração preparado sem chamada de IA.");
      } else {
        toast.error(res.error);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível preparar o guia de decoração.");
    }
  }
  return (
    <div className="space-y-8">\n      {viewer && <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={viewer.title}><div className="flex items-center justify-between gap-3 text-white"><h2 className="font-medium">{viewer.title}</h2><div className="flex items-center gap-2"><button type="button" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} className="rounded border border-white/30 px-3 py-2" aria-label="Diminuir zoom">−</button><span className="min-w-14 text-center text-sm">{Math.round(zoom*100)}%</span><button type="button" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} className="rounded border border-white/30 px-3 py-2" aria-label="Aumentar zoom">+</button><button type="button" onClick={() => setZoom(1)} className="rounded border border-white/30 px-3 py-2">Ajustar</button><button type="button" onClick={() => setViewer(null)} className="rounded bg-white px-4 py-2 font-medium text-black">Fechar ✕</button></div></div><div className="mt-3 flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-lg"><img src={viewer.src} alt={viewer.title} style={{transform:`scale(${zoom})`,transformOrigin:"center",maxWidth:zoom===1?"100%":"none",maxHeight:zoom===1?"100%":"none"}} className="object-contain transition-transform duration-150" /></div><p className="pt-2 text-center text-xs text-white/70">Use + / − para aproximar e mostrar os detalhes ao cliente.</p></div>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/projetos" className="eyebrow hover:text-primary">← Biblioteca</Link>
          <h1 className="text-4xl">{p.title}</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">{p.description}</p>
        </div>
        <Button variant="outline" onClick={() => exportPdf(p, rows, orig.data, rend.data).catch((e) => toast.error(e.message))}>
          <FileDown className="size-4" /> Exportar PDF
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <figure className="space-y-2">
          <figcaption className="eyebrow">Foto original</figcaption>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">{orig.data && <><button type="button" onClick={() => { setViewer({src:orig.data!,title:"Foto original"}); setZoom(1); }} className="h-full w-full cursor-zoom-in" aria-label="Ampliar foto original"><img src={orig.data} alt="Foto original — clique para ampliar" className="h-full w-full object-contain" /></button><button type="button" onClick={() => { setViewer({src:orig.data!,title:"Foto original"}); setZoom(1); }} className="absolute bottom-2 right-2 rounded-md bg-background/90 px-3 py-2 text-xs shadow">Ampliar foto ⤢</button></>}</div>
        </figure>
        <figure className="space-y-2">
          <figcaption className="eyebrow">Render (IA — ilustrativo){p.render_model && ` · ${p.render_model}`}</figcaption>
          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {rend.data && <button type="button" onClick={() => { setViewer({src:rend.data!,title:"Render do projeto"}); setZoom(1); }} className="h-full w-full cursor-zoom-in" aria-label="Abrir render ampliado"><img src={rend.data} alt="Render atual — clique para ampliar" className={`h-full w-full object-contain ${busy === "r" || busy === "e" ? "opacity-40 blur-sm" : ""}`} /></button>}
            {busy === "r" && <div className="absolute flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" /> Gerando render (pode levar até 2 min)…</div>}
            {!rend.data && busy !== "r" && <span className="px-6 text-center text-sm text-muted-foreground">{p.render_status === "error" ? "" : "Nenhum render ainda."}</span>}
          </div>
          {rend.data && <Button type="button" variant="outline" className="w-full" onClick={() => { setViewer({src:rend.data!,title:"Render do projeto"}); setZoom(1); }}>Abrir render ampliado ⤢</Button>}\n          {p.render_status === "error" && busy !== "r" && <p className="text-sm text-destructive">Falha: {p.render_error}</p>}
          <Button className="w-full" disabled={!!busy || p.analysis_status !== "done"} onClick={() => run("r")}>
            {p.render_status === "error" ? <RotateCcw className="size-4" /> : <Wand2 className="size-4" />}
            {p.render_status === "error" ? "Tentar render novamente" : p.render_path ? "Gerar novo render" : "Gerar render"}
          </Button>
          {p.render_path && rend.data && (
            <Button type="button" variant="outline" className="w-full" disabled={!!busy} onClick={runDecorationGuide}>
              <Sparkles className="size-4" /> Decorar projeto · sem IA
            </Button>
          )}
          {p.analysis_status !== "done" && <p className="text-xs text-muted-foreground">Rode a análise primeiro.</p>}
          {p.render_path && rend.data && (
            <div className="mt-4 space-y-3 rounded-lg border bg-card p-4">
              <div>
                <h3 className="text-lg font-semibold">Editar este render</h3>
                <p className="text-sm text-muted-foreground">Descreva apenas o que deve mudar. A foto original não será alterada; cada edição salva uma nova versão.</p>
              </div>
              <label htmlFor="render-edit-instruction" className="text-sm font-medium">Alteração desejada</label>
              <textarea
                id="render-edit-instruction"
                value={editInstruction}
                onChange={(event) => setEditInstruction(event.target.value)}
                maxLength={1500}
                rows={3}
                placeholder="Ex.: Troque somente as portas para carvalho claro. Mantenha a bancada, paredes, iluminação, perspectiva e os demais móveis exatamente como estão."
                className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={!!busy}
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{editInstruction.length}/1500</span>
                <Button onClick={runEdit} disabled={!!busy || editInstruction.trim().length < 3}>
                  {busy === "e" ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                  {busy === "e" ? "Editando render…" : "Aplicar alteração"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">A IA tenta preservar a perspectiva e os detalhes não mencionados, mas a edição generativa não garante preservação pixel a pixel. Confira o resultado antes de usar no projeto executivo.</p>
            </div>
          )}
          {decorationGuide && (
            <section className="mt-4 space-y-4 rounded-lg border bg-card p-4" aria-label="Guia de decoração">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">Guia de decoração</h3>
                  <Badge>Sem chamada de IA</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {decorationGuide.environment} · Estilo: {decorationGuide.style}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{decorationGuide.disclaimer}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {decorationGuide.suggestions.map((item, index) => (
                  <article key={item.category + index} className="space-y-2 rounded-md border p-3">
                    <h4 className="font-medium">{item.category}</h4>
                    <p className="text-sm">{item.suggestion}</p>
                    <p className="text-sm text-muted-foreground">{item.reason}</p>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referências para pesquisar</p>
                      <ul className="mt-1 list-disc pl-5 text-sm">
                        {item.searchTerms.map((term) => <li key={term}>{term}</li>)}
                      </ul>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.buyingNote}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
          {renderHistory.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold">Versões anteriores</h3>
              {renderHistory.slice().reverse().map((version) => (
                <div key={version.path} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{version.instruction || "Versão anterior"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(version.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                  <Button size="sm" variant="outline" disabled={!!busy} onClick={() => runRestore(version.path)}>
                    {busy === "restore" ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                    Restaurar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </figure>
      </div>

      <section className="rounded-lg border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl">Medidas</h2>
          <div className="flex gap-2 text-xs"><Badge className={statusStyle.informada}>informada</Badge><Badge className={statusStyle.estimada}>estimada</Badge><Badge className={statusStyle.pendente}>pendente</Badge></div>
        </div>
        <div className="grid gap-x-8 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.grupo + r.campo} className="flex items-center justify-between border-b py-2 text-sm">
              <span><span className="text-muted-foreground">{r.grupo} ·</span> {r.campo}</span>
              <span className="flex items-center gap-2">{r.valor}<Badge className={statusStyle[r.status]}>{r.status}</Badge></span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Estimativas vêm de leitura visual da foto e não substituem medição em obra.</p>
      </section>

      <section className="space-y-4 rounded-lg border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl">Análise estruturada</h2>
          <Button variant="secondary" disabled={!!busy} onClick={() => run("a")}>
            {busy === "a" ? <Loader2 className="size-4 animate-spin" /> : p.analysis_status === "error" ? <RotateCcw className="size-4" /> : <Sparkles className="size-4" />}
            {busy === "a" ? "Analisando…" : p.analysis_status === "done" ? "Refazer análise" : p.analysis_status === "error" ? "Tentar novamente" : "Analisar ambiente"}
          </Button>
        </div>
        {p.analysis_status === "error" && busy !== "a" && <p className="text-sm text-destructive">Falha: {p.analysis_error}</p>}
        {a && (
          <div className="grid gap-6 text-sm md:grid-cols-2">
            <Block title="Ambiente"><p><b>{a.ambiente?.tipo}</b> — {a.ambiente?.descricao}</p><p className="text-muted-foreground">Luz: {a.ambiente?.iluminacao}</p></Block>
            <Block title="Proposta"><p>{a.proposta?.resumo}</p><p><b>Superiores:</b> {a.proposta?.superiores}</p><p><b>Inferiores:</b> {a.proposta?.inferiores}</p></Block>
            <List title="Elementos existentes" items={a.elementos_existentes} />
            <List title="Restrições" items={a.restricoes} />
            <List title="Materiais" items={a.proposta?.materiais} />
            <List title="Ferragens" items={a.proposta?.ferragens} />
            <List title="Pendências para visita técnica" items={a.pendencias} />
            <List title="Riscos" items={a.riscos} />
          </div>
        )}
      </section>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-1"><h3 className="eyebrow">{title}</h3>{children}</div>;
}
function List({ title, items }: { title: string; items?: string[] }) {
  return <Block title={title}><ul className="list-disc space-y-0.5 pl-5">{(items ?? []).map((x, i) => <li key={i}>{x}</li>)}</ul></Block>;
}
