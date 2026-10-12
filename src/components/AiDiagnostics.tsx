import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { aiDiagnostics } from "@/lib/projects.functions";

export function AiDiagnostics() {
  const fn = useServerFn(aiDiagnostics);
  const q = useQuery({ queryKey: ["ai-diag"], queryFn: () => fn(), staleTime: 5 * 60 * 1000 });
  if (q.isLoading) return <div className="rounded-md border bg-card p-3 text-xs text-muted-foreground">Verificando provedor de IA…</div>;
  if (q.error) return <div className="rounded-md border border-destructive/40 bg-card p-3 text-xs text-destructive">Diagnóstico falhou: {(q.error as Error).message}</div>;
  const d = q.data!;
  const ok = d.keyPresent && d.reachable && d.analysisAvailable && d.renderAvailable;
  return (
    <div className={`flex items-start gap-3 rounded-md border bg-card p-3 text-xs ${ok ? "" : "border-warning"}`}>
      {ok ? <CheckCircle2 className="mt-0.5 size-4 text-success" /> : <AlertTriangle className="mt-0.5 size-4 text-warning" />}
      <div className="space-y-0.5">
        <p className="font-semibold">{ok ? "Provedor de IA configurado" : "Provedor de IA com pendências"}</p>
        <p className="text-muted-foreground">
          Chave no servidor: {d.keyPresent ? "sim" : "não"} · Gateway: {d.reachable ? "acessível" : "inacessível"} · Análise ({d.analysisModel}): {d.analysisAvailable ? "disponível" : "indisponível"} · Render ({d.renderModel}): {d.renderAvailable ? "disponível" : "indisponível"}
        </p>
        {d.error && <p className="text-destructive">{d.error}</p>}
      </div>
    </div>
  );
}
