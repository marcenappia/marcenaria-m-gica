import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, RotateCcw, FileDown, Sparkles, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analyzeProject, renderProject } from "@/lib/projects.functions";
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
  const [busy, setBusy] = useState<"a" | "r" | null>(null);
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
  return (
    <div className="space-y-8">
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
          <div className="aspect-[4/3] overflow-hidden rounded-lg border bg-muted">{orig.data && <img src={orig.data} alt="Foto original" className="h-full w-full object-contain" />}</div>
        </figure>
        <figure className="space-y-2">
          <figcaption className="eyebrow">Render (IA — ilustrativo){p.render_model && ` · ${p.render_model}`}</figcaption>
          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {rend.data && <img src={rend.data} alt="Render" className={`h-full w-full object-contain ${busy === "r" ? "opacity-40 blur-sm" : ""}`} />}
            {busy === "r" && <div className="absolute flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" /> Gerando render (pode levar até 2 min)…</div>}
            {!rend.data && busy !== "r" && <span className="px-6 text-center text-sm text-muted-foreground">{p.render_status === "error" ? "" : "Nenhum render ainda."}</span>}
          </div>
          {p.render_status === "error" && busy !== "r" && <p className="text-sm text-destructive">Falha: {p.render_error}</p>}
          <Button className="w-full" disabled={!!busy || p.analysis_status !== "done"} onClick={() => run("r")}>
            {p.render_status === "error" ? <RotateCcw className="size-4" /> : <Wand2 className="size-4" />}
            {p.render_status === "error" ? "Tentar render novamente" : p.render_path ? "Gerar novo render" : "Gerar render"}
          </Button>
          {p.analysis_status !== "done" && <p className="text-xs text-muted-foreground">Rode a análise primeiro.</p>}
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
