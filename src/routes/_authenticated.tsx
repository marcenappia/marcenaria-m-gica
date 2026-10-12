import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Camera, Images, LogOut, PanelsTopLeft, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/entrar" });
    return { user: data.session.user };
  },
  component: Layout,
});

function Layout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/entrar" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 flex-col border-r bg-card/70 p-5 lg:flex">
          <Link to="/projetos" className="flex items-center gap-3 rounded-xl px-2 py-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <PanelsTopLeft className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-lg leading-tight text-foreground">Marcenaria</span>
              <span className="block font-display text-lg leading-tight text-primary">Mágica</span>
            </span>
          </Link>

          <div className="mb-3 mt-9 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Seu espaço de trabalho</div>
          <nav className="space-y-1" aria-label="Navegação principal">
            <Link to="/projetos" className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/15">
              <Images className="size-4" /> Projetos e renders
            </Link>
            <Link to="/projetos/novo" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-foreground/80 transition-colors hover:bg-muted">
              <Camera className="size-4" /> Novo render com foto
              <ArrowUpRight className="ml-auto size-4 text-muted-foreground" />
            </Link>
          </nav>

          <div className="mt-auto">
            <div className="wood-grain rounded-xl border border-primary/15 p-4">
              <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </div>
              <p className="font-display text-lg">Da foto ao projeto</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Registre o ambiente, descreva sua ideia e organize seus renders em um só lugar.</p>
              <Button asChild size="sm" className="mt-4 w-full">
                <Link to="/projetos/novo">Começar agora</Link>
              </Button>
            </div>
            <div className="mt-5 flex items-center gap-3 border-t pt-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                {(user.email?.[0] ?? "M").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{user.email ?? "Minha conta"}</p>
                <p className="text-xs text-muted-foreground">Área de trabalho</p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Sair da conta" onClick={signOut}>
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur-xl">
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-9">
              <Link to="/projetos" className="flex items-center gap-2 lg:hidden">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><PanelsTopLeft className="size-4" /></span>
                <span className="font-display text-lg">Marcenaria <span className="text-primary">Mágica</span></span>
              </Link>
              <div className="hidden lg:block">
                <p className="text-xs text-muted-foreground">AMBIENTES • MARCENARIA SOB MEDIDA</p>
                <p className="text-sm font-medium">Seu estúdio de criação</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="hidden max-w-52 truncate text-xs text-muted-foreground sm:inline">{user.email}</span>
                <Button asChild size="sm" className="gap-2">
                  <Link to="/projetos/novo"><Camera className="size-4" /><span className="hidden sm:inline">Novo render</span><span className="sm:hidden">Criar</span></Link>
                </Button>
                <Button variant="ghost" size="icon" aria-label="Sair da conta" className="lg:hidden" onClick={signOut}>
                  <LogOut className="size-4" />
                </Button>
              </div>
            </div>
            <nav className="flex gap-2 overflow-x-auto border-t px-4 py-2 lg:hidden" aria-label="Navegação móvel">
              <Link to="/projetos" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold text-primary"><Images className="size-3.5" /> Projetos</Link>
              <Link to="/projetos/novo" className="inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-foreground/80 hover:bg-muted"><Camera className="size-3.5" /> Render com foto</Link>
            </nav>
          </header>
          <main className="w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-9 lg:py-10">
            <div className="mx-auto w-full max-w-6xl">
              <Outlet />
            </div>
          </main>
          <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-9">
            Marcenaria Mágica <span className="mx-1">·</span> Seu ambiente, suas ideias, seu projeto.
          </footer>
        </div>
      </div>
    </div>
  );
}
