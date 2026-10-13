import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar — Marcenaria Mágica" },
      { name: "description", content: "Acesse sua biblioteca de projetos de marcenaria." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Entrar — Marcenaria Mágica" },
      { property: "og:description", content: "Acesse sua biblioteca de projetos de marcenaria." },
    ],
  }),
  component: Entrar,
});

function Entrar() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/projetos" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/projetos` },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/projetos" });
        else toast.success("Conta criada. Confirme pelo link enviado ao seu e-mail.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na autenticação");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="wood-grain hidden flex-col justify-between bg-secondary p-12 lg:flex">
        <span className="eyebrow">Oficina IA</span>
        <div>
          <h1 className="text-5xl leading-tight text-foreground">Do ambiente real ao projeto de marcenaria.</h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Foto, pedido e medidas viram análise técnica, render e PDF. Medidas que não foram informadas ficam marcadas como pendentes — nunca inventadas.
          </p>
        </div>
        <span className="text-xs text-muted-foreground">Projetista de Marcenaria</span>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <span className="eyebrow">{mode === "in" ? "Acesso" : "Nova conta"}</span>
            <h2 className="mt-1 text-3xl">{mode === "in" ? "Entrar" : "Criar conta"}</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Aguarde…" : mode === "in" ? "Entrar" : "Criar conta"}
          </Button>
          <button type="button" className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
