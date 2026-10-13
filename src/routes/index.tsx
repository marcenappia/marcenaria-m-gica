import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marcenaria Mágica — Projetista de Marcenaria" },
      { name: "description", content: "Foto do ambiente, medidas e pedido viram análise técnica e render de marcenaria." },
      { property: "og:title", content: "Marcenaria Mágica — Projetista de Marcenaria" },
      { property: "og:description", content: "Foto do ambiente, medidas e pedido viram análise técnica e render de marcenaria." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/projetos" });
  },
});
