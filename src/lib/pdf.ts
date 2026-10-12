import { jsPDF } from "jspdf";
import type { DimensionRow } from "./cabinets";
import type { Project } from "./storage";

async function toDataUrl(url: string) {
  const blob = await (await fetch(url)).blob();
  return await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(blob); });
}

export async function exportPdf(p: Project, rows: DimensionRow[], originalUrl?: string, renderUrl?: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 18;
  const line = (t: string, size = 10, gap = 5) => {
    doc.setFontSize(size);
    for (const l of doc.splitTextToSize(t, 180)) { if (y > 280) { doc.addPage(); y = 18; } doc.text(l, 15, y); y += gap; }
  };
  line("Oficina IA — Projetista de Marcenaria", 9);
  line(p.title, 18, 9);
  line(p.description, 10);
  if (p.style) line(`Estilo: ${p.style}`);
  for (const [label, url] of [["Foto original", originalUrl], ["Render gerado por IA (ilustrativo)", renderUrl]] as const) {
    if (!url) continue;
    const data = await toDataUrl(url);
    if (y > 170) { doc.addPage(); y = 18; }
    line(label, 11);
    doc.addImage(data, 15, y, 120, 90); y += 95;
  }
  doc.addPage(); y = 18;
  line("Medidas", 14, 7);
  for (const r of rows) line(`${r.grupo} · ${r.campo}: ${r.valor} [${r.status.toUpperCase()}]`);
  line("Medidas estimadas são leituras visuais aproximadas; pendentes exigem visita técnica.", 8);
  const a = p.analysis;
  if (a) {
    y += 4; line("Análise", 14, 7);
    line(`Ambiente: ${a.ambiente?.tipo} — ${a.ambiente?.descricao}`);
    line(`Proposta: ${a.proposta?.resumo}`);
    line(`Superiores: ${a.proposta?.superiores}`);
    line(`Inferiores: ${a.proposta?.inferiores}`);
    line(`Materiais: ${(a.proposta?.materiais ?? []).join(", ")}`);
    line(`Ferragens: ${(a.proposta?.ferragens ?? []).join(", ")}`);
    line("Pendências:", 11); for (const x of a.pendencias ?? []) line(`• ${x}`);
    line("Riscos:", 11); for (const x of a.riscos ?? []) line(`• ${x}`);
  }
  doc.save(`${p.title.replace(/[^\w\-]+/g, "_")}.pdf`);
}
