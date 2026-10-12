/**
 * Catálogo da persona Marcenaria Mágica.
 *
 * Mantém a experiência de renderização independente do Marcena e define
 * um contrato de dados que poderá ser integrado futuramente por API.
 * Medidas detectadas visualmente nunca devem ser tratadas como confirmadas.
 */
export const ENVIRONMENTS = [
  { id: "cozinha", label: "Cozinha", description: "Planejamento de armários, bancadas e módulos para cozinha." },
  { id: "sala", label: "Sala", description: "Painéis, racks, estantes e armazenamento para sala." },
  { id: "living", label: "Living", description: "Ambientes integrados, bar, cristaleira e aparadores." },
  { id: "quarto", label: "Quarto", description: "Roupeiros, cabeceiras e mobiliário sob medida." },
  { id: "closet", label: "Closet", description: "Armazenamento, cabideiros, gavetas e prateleiras." },
  { id: "banheiro", label: "Banheiro", description: "Gabinetes, espelheiras e nichos." },
  { id: "lavabo", label: "Lavabo", description: "Gabinete compacto, espelho e nichos." },
  { id: "lavanderia", label: "Lavanderia", description: "Armários funcionais, tanque e bancada de apoio." },
  { id: "churrasqueira", label: "Churrasqueira / Gourmet", description: "Bancadas, armários e módulos para área gourmet." },
  { id: "home-office", label: "Home office", description: "Mesas, gaveteiros, estantes e armários." },
  { id: "comercial", label: "Comercial", description: "Recepção, exposição, armazenamento e atendimento." },
  { id: "outro", label: "Outro ambiente", description: "Projeto personalizado definido em conjunto com a pessoa usuária." },
] as const;

export type EnvironmentId = (typeof ENVIRONMENTS)[number]["id"];

export const JOINERY_MODULES = {
  cozinha: [
    { id: "inferiores", label: "Armários inferiores", group: "armazenamento" },
    { id: "superiores", label: "Armários superiores", group: "armazenamento" },
    { id: "torre-quente", label: "Torre quente / eletrodomésticos", group: "eletrodomesticos" },
    { id: "despenseiro", label: "Despenseiro", group: "armazenamento" },
    { id: "gaveteiro", label: "Gaveteiro", group: "armazenamento" },
    { id: "porta-temperos", label: "Porta-temperos", group: "organizacao" },
    { id: "bancada", label: "Bancada", group: "superficies" },
    { id: "ilha", label: "Ilha", group: "superficies" },
    { id: "peninsula", label: "Península", group: "superficies" },
    { id: "nicho", label: "Nichos", group: "organizacao" },
    { id: "cristaleira", label: "Cristaleira", group: "exposicao" },
  ],
  sala: [
    { id: "painel-tv", label: "Painel de TV", group: "midia" },
    { id: "rack", label: "Rack", group: "armazenamento" },
    { id: "estante", label: "Estante", group: "exposicao" },
    { id: "prateleiras", label: "Prateleiras", group: "exposicao" },
    { id: "aparador", label: "Aparador", group: "armazenamento" },
    { id: "bar", label: "Bar", group: "exposicao" },
    { id: "cristaleira", label: "Cristaleira", group: "exposicao" },
  ],
  living: [
    { id: "painel-tv", label: "Painel de TV", group: "midia" },
    { id: "rack", label: "Rack", group: "armazenamento" },
    { id: "bar", label: "Bar", group: "exposicao" },
    { id: "cristaleira", label: "Cristaleira", group: "exposicao" },
    { id: "aparador", label: "Aparador", group: "armazenamento" },
    { id: "estante", label: "Estante", group: "exposicao" },
  ],
  quarto: [
    { id: "roupeiro", label: "Roupeiro", group: "armazenamento" },
    { id: "portas-correr", label: "Portas de correr", group: "frentes" },
    { id: "maleiro", label: "Maleiro", group: "armazenamento" },
    { id: "gaveteiro", label: "Gaveteiro", group: "armazenamento" },
    { id: "cabeçeira", label: "Cabeceira", group: "cama" },
    { id: "criados", label: "Mesas de cabeceira", group: "cama" },
  ],
  closet: [
    { id: "roupeiro", label: "Módulos de roupeiro", group: "armazenamento" },
    { id: "cabideiro", label: "Cabideiros", group: "organizacao" },
    { id: "gaveteiro", label: "Gaveteiros", group: "armazenamento" },
    { id: "sapateira", label: "Sapateira", group: "organizacao" },
    { id: "maleiro", label: "Maleiro", group: "armazenamento" },
    { id: "espelho", label: "Espelho", group: "acessorios" },
  ],
  banheiro: [
    { id: "gabinete", label: "Gabinete sob bancada", group: "armazenamento" },
    { id: "espelheira", label: "Espelheira", group: "acessorios" },
    { id: "nicho", label: "Nicho", group: "organizacao" },
    { id: "armario-alto", label: "Armário alto", group: "armazenamento" },
  ],
  lavabo: [
    { id: "gabinete", label: "Gabinete compacto", group: "armazenamento" },
    { id: "espelheira", label: "Espelho / espelheira", group: "acessorios" },
    { id: "nicho", label: "Nicho", group: "organizacao" },
  ],
  lavanderia: [
    { id: "armario-inferior", label: "Armário inferior", group: "armazenamento" },
    { id: "armario-superior", label: "Armário superior", group: "armazenamento" },
    { id: "torre-lavanderia", label: "Torre para máquinas", group: "eletrodomesticos" },
    { id: "bancada", label: "Bancada de apoio", group: "superficies" },
    { id: "vassoureiro", label: "Vassoureiro", group: "organizacao" },
  ],
  churrasqueira: [
    { id: "armario-inferior", label: "Armário inferior", group: "armazenamento" },
    { id: "armario-superior", label: "Armário superior", group: "armazenamento" },
    { id: "bancada", label: "Bancada", group: "superficies" },
    { id: "ilha", label: "Ilha gourmet", group: "superficies" },
    { id: "nicho", label: "Nichos", group: "organizacao" },
  ],
  "home-office": [
    { id: "mesa", label: "Mesa de trabalho", group: "trabalho" },
    { id: "gaveteiro", label: "Gaveteiro", group: "armazenamento" },
    { id: "estante", label: "Estante", group: "armazenamento" },
    { id: "armario", label: "Armário", group: "armazenamento" },
    { id: "prateleiras", label: "Prateleiras", group: "exposicao" },
  ],
  comercial: [
    { id: "recepcao", label: "Balcão de recepção", group: "atendimento" },
    { id: "expositor", label: "Expositores", group: "exposicao" },
    { id: "armario", label: "Armários de armazenamento", group: "armazenamento" },
    { id: "bancada", label: "Bancada de atendimento", group: "atendimento" },
    { id: "prateleiras", label: "Prateleiras", group: "exposicao" },
  ],
  outro: [
    { id: "modulo-personalizado", label: "Módulo personalizado", group: "personalizado" },
    { id: "armario", label: "Armário", group: "armazenamento" },
    { id: "bancada", label: "Bancada", group: "superficies" },
    { id: "nicho", label: "Nicho", group: "organizacao" },
  ],
} as const satisfies Record<EnvironmentId, readonly { id: string; label: string; group: string }[]>;

export type JoineryModule = (typeof JOINERY_MODULES)[EnvironmentId][number];

/** Retorna módulos adequados ao ambiente selecionado, sem inferir medidas. */
export function getModulesForEnvironment(environment: EnvironmentId): readonly JoineryModule[] {
  return JOINERY_MODULES[environment] as readonly JoineryModule[];
}

export function isEnvironmentId(value: string): value is EnvironmentId {
  return ENVIRONMENTS.some((environment) => environment.id === value);
}

/** Contrato de integração versionado para futura conexão com Marcena. */
export const MARCENA_INTEGRATION_CONTRACT = {
  schemaVersion: "1.0.0",
  module: "marcenaria-magica",
  capabilities: ["environment-selection", "joinery-module-catalog", "photo-to-render", "sketch-to-render"] as const,
  renderInvariant: "Preservar geometria, câmera, paredes, portas, janelas, piso e teto da imagem original; alterar somente a marcenaria solicitada.",
} as const;
