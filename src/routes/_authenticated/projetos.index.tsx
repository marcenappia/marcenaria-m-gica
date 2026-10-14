import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, ImageOff, Wand2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useSignedUrl, type Project } from "@/lib/storage";
import { AiDiagnostics } from "@/components/AiDiagnostics";

export const Route = createFileRoute("/_authenticated/projetos/")({
  head: () => ({
    meta: [
      { title: "Biblioteca de projetos — Marcenaria Mágica" },
      { name: "description", content: "Seus projetos de marcenaria com foto, análise e render." },
      { property: "og:title", content: "Biblioteca de projetos — Marcenaria Mágica" },
      { property: "og:description", content: "Seus projetos de marcenaria com foto, análise e render." },
    ],
  }),
  component: Biblioteca,
});

function Biblioteca() {
  const q = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Biblioteca</span>
          <h1 className="text-4xl">Projetos</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">Seus ambientes, análises e renders em um só lugar.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/projetos/novo">
            <Plus className="size-4" /> Novo projeto
          </Link>
        </Button>
      </div>

      <section className="wood-grain flex flex-col gap-5 rounded-xl border border-primary/20 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7" aria-labelledby="renderer-entry-title">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wand2 className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="eyebrow">Ferramenta principal</p>
            <h2 id="renderer-entry-title" className="text-2xl">Renderizador de ambientes</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Envie uma foto do ambiente, descreva o móvel que deseja e gere o render dentro do projeto. Você pode tirar uma foto pelo celular ou escolher uma imagem da galeria.
            </p>
          </div>
        </div>
        <Button asChild className="shrink-0">
          <Link to="/projetos/novo">
            Começar render com foto <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>

      <AiDiagnostics />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl">Seus projetos</h2>
        {q.data && q.data.length > 0 && (
          <span className="text-sm text-muted-foreground">{q.data.length} {q.data.length === 1 ? "projeto" : "projetos"}</span>
        )}
      </div>
      {q.isLoading && <p className="text-muted-foreground">Carregando…</p>}
      {q.error && <p className="text-destructive">Erro ao carregar: {(q.error as Error).message}</p>}
      {q.data && q.data.length === 0 && (
        <div className="wood-grain rounded-lg border border-dashed p-12 text-center">
          <h2 className="text-2xl">Nenhum projeto ainda</h2>
          <p className="mt-2 text-muted-foreground">Comece pelo renderizador acima: envie a foto de um ambiente para criar seu primeiro projeto.</p>
          <Button asChild className="mt-5">
            <Link to="/projetos/novo"><Wand2 className="size-4" /> Enviar foto e começar</Link>
          </Button>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {q.data?.map((p) => <ProjectCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}

function ProjectCard({ p }: { p: Project }) {
  const img = useSignedUrl(p.render_path ?? p.original_path);
  return (
    <Link to="/projetos/$id" params={{ id: p.id }} className="group overflow-hidden rounded-lg border bg-card transition hover:border-primary/40 hover:shadow-md">
      <div className="aspect-[4/3] bg-muted">
        {img.data ? (
          <img src={img.data} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground"><ImageOff className="size-6" /></div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="text-lg group-hover:text-primary">{p.title}</h3>
        <p className="text-xs text-muted-foreground">
          {new Date(p.created_at).toLocaleDateString("pt-BR")} · Análise: {label(p.analysis_status)} · Render: {label(p.render_status)}
        </p>
        <p className="flex items-center gap-2 pt-2 text-sm font-medium text-primary">
          Abrir projeto e renderizar <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </p>
      </div>
    </Link>
  );
}

function label(s: string) {
  return ({ pending: "pendente", idle: "não gerado", running: "em andamento", done: "concluído", error: "erro" } as Record<string, string>)[s] ?? s;
}
