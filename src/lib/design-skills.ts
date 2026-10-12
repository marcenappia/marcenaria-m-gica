/**
 * Skills locais da Marcenaria Mágica.
 * São regras de domínio, não agentes remotos: ler e aplicar este contexto não consome IA.
 */
export const INTERIOR_DESIGN_RENDER_SKILL = `
INTERIOR DESIGN SKILL — aplicar em toda renderização:
- Respeite primeiro o estilo e as escolhas explicitamente aprovadas pelo cliente.
- Harmonize marcenaria, bancada, metais, eletrodomésticos, iluminação e poucos objetos decorativos; não sobrecarregue.
- Use uma paleta coerente de 2–4 cores e materiais compatíveis com o estilo indicado.
- Eletros devem parecer fisicamente plausíveis, proporcionais e integrados ao layout; não mova pontos hidráulicos/elétricos nem invente nichos incompatíveis.
- Decoração é secundária à marcenaria e nunca pode esconder portas, puxadores, ferragens, medidas ou detalhes que precisam ser avaliados.
- Não substitua eletros/objetos já existentes, a menos que o cliente peça.
- Não invente marcas, modelos, preços, disponibilidade ou links de compra.
- Não altere arquitetura, paredes, portas, janelas, piso, teto, perspectiva ou iluminação original sem pedido explícito.
- As medidas fornecidas pelo cliente prevalecem; nunca invente medidas exatas pela fotografia.
`.trim();

export const TECHNICAL_CABINETRY_SKILL = `
TECHNICAL CABINETRY SKILL:
- Preserve module count, door/drawer arrangement, opening direction, gaps, proportions and dimensions explicitly specified.
- Distinguish customer-provided dimensions from visual estimates and items pending on-site measurement.
- Do not claim a photorealistic image is a construction drawing or proof of technical feasibility.
- Keep clearances, appliance access, ventilation and door swing in mind; flag uncertainty instead of silently changing the design.
`.trim();

export const RENDER_EDIT_PRESERVATION_SKILL = `
RENDER AND EDIT SKILL:
- Initial render: edit the supplied room photo, not an unrelated scene.
- Local edit: change only the requested target and preserve the rest of the latest approved render.
- Keep camera, room geometry, openings, fixed architecture, perspective, lighting and unrelated furniture stable.
- Save every successful result as a new version; never overwrite the original photo.
- Generative image editing cannot guarantee pixel-perfect preservation; the user must review the result.
`.trim();

export type DecorationSuggestion = {
  category: string;
  suggestion: string;
  reason: string;
  searchTerms: string[];
  confidence: "baseado-no-estilo" | "generico";
  buyingNote: string;
};

export type DecorationGuide = {
  title: string;
  style: string;
  environment: string;
  aiCost: 0;
  disclaimer: string;
  suggestions: DecorationSuggestion[];
};

function normalize(value: unknown): string {
  return typeof value === "string"
    ? value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    : "";
}

/**
 * Gera um guia inicial por regras locais, sem fetch, LLM, geração de imagem ou créditos.
 * Não recomenda SKU, marca, preço nem disponibilidade sem uma fonte de catálogo.
 */
export function buildDecorationGuide(project: {
  title?: string | null;
  description?: string | null;
  style?: string | null;
  analysis?: unknown;
}): DecorationGuide {
  const analysis = project.analysis && typeof project.analysis === "object"
    ? project.analysis as { ambiente?: { tipo?: string; descricao?: string }; proposta?: { materiais?: string[] } }
    : {};
  const style = project.style?.trim() || "contemporâneo neutro";
  const envText = normalize([
    analysis.ambiente?.tipo,
    analysis.ambiente?.descricao,
    project.title,
    project.description,
  ].filter(Boolean).join(" "));
  const styleText = normalize(style);
  const materials = (analysis.proposta?.materiais ?? []).filter((x): x is string => typeof x === "string");
  const styleAware = !!project.style?.trim();
  const suggestions: DecorationSuggestion[] = [];
  const add = (category: string, suggestion: string, reason: string, searchTerms: string[]) => {
    suggestions.push({
      category,
      suggestion,
      reason,
      searchTerms,
      confidence: styleAware ? "baseado-no-estilo" : "generico",
      buyingNote: "Referência de busca, não produto validado. Confirmar dimensões, acabamento, compatibilidade, preço e disponibilidade antes de comprar.",
    });
  };

  if (/cozinha|kitchen|gourmet/.test(envText)) {
    add("Eletrodomésticos", "Considere eletros de acabamento coordenado (inox escovado ou preto), mantendo ventilação e acessos previstos.", "Integra visualmente os equipamentos à marcenaria sem presumir medidas ou modelo.", ["geladeira acabamento coordenado medidas nicho", "cooktop medidas instalação", "forno de embutir dimensões ventilação"]);
    add("Bancada e metais", "Escolha torneira, cuba e acessórios com o mesmo tom de metal; harmonize a pedra com o padrão dos armários.", "Reduz a mistura de acabamentos e deixa a composição mais coesa.", ["torneira cozinha acabamento coordenado", "organizador interno gaveta cozinha"]);
    add("Decoração funcional", "Use no máximo poucos itens funcionais na bancada, sem bloquear área de preparo ou esconder a marcenaria.", "Mantém o projeto apresentável e utilizável.", ["bandeja cozinha minimalista", "vaso pequeno cozinha"]);
  } else if (/quarto|dormitorio|bedroom|closet/.test(envText)) {
    add("Iluminação", "Avalie luz indireta quente em pontos de destaque, sem substituir a iluminação técnica existente.", "Cria conforto visual e valoriza texturas.", ["luminaria cabeceira luz quente", "fita led perfil difusor marcenaria"]);
    add("Têxteis e decoração", "Combine roupa de cama, cortinas e poucos objetos em tons que repitam a paleta do acabamento.", "Amarra visualmente os materiais sem competir com o mobiliário.", ["cortina tecido tons neutros", "roupa de cama paleta coordenada", "bandeja decorativa quarto"]);
  } else if (/sala|living|estar|tv|home theater/.test(envText)) {
    add("Eletrônicos e cabos", "Dimensione TV e equipamentos conforme o painel e a distância de visualização; planeje ventilação e acesso aos cabos.", "Evita esconder ventilação ou criar nichos incompatíveis.", ["televisor dimensões largura altura", "organizador cabos painel tv"]);
    add("Iluminação e objetos", "Use iluminação de apoio e poucos objetos com alturas variadas, sem ocultar o painel ou as prateleiras.", "Dá profundidade e mantém a marcenaria como protagonista.", ["luminaria de piso design simples", "vaso decorativo tons coordenados", "livros decorativos neutros"]);
  } else if (/banheiro|lavabo|bath/.test(envText)) {
    add("Metais e acessórios", "Coordene torneira, puxadores e acessórios e confirme resistência à umidade do material escolhido.", "Ajuda a manter unidade visual e adequação ao ambiente.", ["torneira banheiro acabamento coordenado", "acessorios banheiro resistentes a umidade"]);
    add("Iluminação", "Considere luz de espelho com reprodução de cor adequada e proteção compatível com a zona de instalação.", "Melhora o uso diário sem sugerir instalação fora de especificação.", ["espelho com iluminação banheiro especificações"]);
  } else {
    add("Iluminação", "Prefira uma peça de iluminação de apoio coerente com o estilo, sem alterar pontos elétricos sem avaliação técnica.", "É uma forma flexível de complementar a composição.", ["luminaria decorativa estilo " + style]);
    add("Objetos decorativos", "Escolha poucos objetos em materiais e cores que repitam o acabamento principal.", "Mantém a composição intencional e deixa o móvel em evidência.", ["objetos decorativos estilo " + style, "vaso decorativo tons coordenados"]);
  }

  if (/industrial/.test(styleText)) {
    suggestions.push({
      category: "Direção de estilo",
      suggestion: "Priorize metal preto fosco, madeira de leitura natural e formas simples, sem exagerar no contraste.",
      reason: "São sinais visuais comuns do estilo industrial; valide com as escolhas aprovadas pelo cliente.",
      searchTerms: ["metal preto fosco decoração", "madeira natural decoração industrial"],
      confidence: "baseado-no-estilo",
      buyingNote: "Referência de busca, não produto validado. Confirmar dimensões, acabamento, compatibilidade, preço e disponibilidade antes de comprar.",
    });
  } else if (/escandinav|minimal|contempor|clean/.test(styleText)) {
    suggestions.push({
      category: "Direção de estilo",
      suggestion: "Prefira formas simples, tons suaves e poucos acessórios; deixe a textura da madeira ou o acabamento principal aparecer.",
      reason: "Evita excesso visual e reforça a leitura limpa do projeto.",
      searchTerms: ["decoracao minimalista tons neutros", "objetos decorativos formas simples"],
      confidence: "baseado-no-estilo",
      buyingNote: "Referência de busca, não produto validado. Confirmar dimensões, acabamento, compatibilidade, preço e disponibilidade antes de comprar.",
    });
  } else if (/rustic|rustico|natural/.test(styleText)) {
    suggestions.push({
      category: "Direção de estilo",
      suggestion: "Combine texturas naturais e tons terrosos em poucos pontos, sem misturar padrões de madeira concorrentes.",
      reason: "Ajuda a manter unidade entre os acabamentos.",
      searchTerms: ["decoracao natural tons terrosos", "texturas naturais interiores"],
      confidence: "baseado-no-estilo",
      buyingNote: "Referência de busca, não produto validado. Confirmar dimensões, acabamento, compatibilidade, preço e disponibilidade antes de comprar.",
    });
  }

  if (materials.length) {
    add("Materiais do projeto", materials.slice(0, 3).join("; "), "Materiais identificados na análise do projeto; confirmar nome comercial e amostra real antes de especificar.", materials.slice(0, 3).map((m) => m + " amostra acabamento"));
  }

  return {
    title: project.title?.trim() || "Projeto",
    style,
    environment: analysis.ambiente?.tipo || "Ambiente não classificado",
    aiCost: 0,
    disclaimer: "Guia preliminar gerado por regras locais, sem chamada de IA. As sugestões não são produtos verificados nem substituem especificação profissional, conferência de medidas ou validação de instalação.",
    suggestions,
  };
}
