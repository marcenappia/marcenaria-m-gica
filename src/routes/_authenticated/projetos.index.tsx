import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useSignedUrl, type Project } from "@/lib/storage";
import { AiDiagnostics } from "@/components/AiDiagnostics";

export const Route = createFileRoute("/_authenticated/projetos/")({
  head: () => ({
    meta: [
      { title: "Biblioteca de projetos — Oficina IA" },
      { name: "description", content: "Seus projetos de marcenaria com foto, análise e render." },
      { property: "og:title", content: "Biblioteca de projetos — Oficina IA" },
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
        </div>
        <Button asChild>
          <Link to="/projetos/novo">
            <Plus className="size-4" /> Novo projeto
          </Link>
        </Button>
      </div>
      <AiDiagnostics />
      {q.isLoading && <p className="text-muted-foreground">Carregando…</p>}
      {q.error && <p className="text-destructive">Erro ao carregar: {(q.error as Error).message}</p>}
      {q.data && q.data.length === 0 && (
        <div className="wood-grain rounded-lg border border-dashed p-12 text-center">
          <h2 className="text-2xl">Nenhum projeto ainda</h2>
          <p className="mt-2 text-muted-foreground">Envie a foto de um ambiente para começar.</p>
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
    <Link to="/projetos/$id" params={{ id: p.id }} className="group overflow-hidden rounded-lg border bg-card transition hover:shadow-md">
      <div className="aspect-[4/3] bg-muted">
        {img.data ? (
          <img src={img.data} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground"><ImageOff className="size-6" /></div>
        )}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="text-lg group-hover:text-primary">{p.title}</h3>
        <p className="text-xs text-muted-foreground">
          {new Date(p.created_at).toLocaleDateString("pt-BR")} · Análise: {label(p.analysis_status)} · Render: {label(p.render_status)}
        </p>
      </div>
    </Link>
  );
}

function label(s: string) {
  return ({ pending: "pendente", idle: "não gerado", running: "em andamento", done: "concluído", error: "erro" } as Record<string, string>)[s] ?? s;
}
