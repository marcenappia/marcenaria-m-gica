# Design System

**Status:** princípios e tokens semânticos iniciais; auditar os componentes e estilos existentes antes de consolidar valores definitivos.

## 1. Princípios

- Visual limpo, profissional, acolhedor e orientado ao trabalho de marcenaria.
- Conteúdo e fotos dos projetos são protagonistas; evitar decoração visual que distraia.
- Priorizar clareza, hierarquia e ações previsíveis, não uma aparência genérica de “IA”.
- Interface responsiva: fluxos principais devem funcionar em celular e desktop.
- Consistência antes de criar um componente novo; reutilizar os componentes existentes quando apropriado.

## 2. Direção visual

- Base clara e neutra, com azul como cor de ação quando compatível com a identidade atual.
- Superfícies discretas, bordas suaves e sombras contidas.
- Tipografia legível e hierarquia tipográfica consistente.
- Ícones simples e funcionais; não usar emojis como substitutos de ícones de interface.
- Render e foto original com espaço suficiente para inspeção e comparação.

## 3. Tokens semânticos

Os valores exatos devem ser extraídos dos estilos globais e componentes atuais antes de uma alteração visual ampla. Evitar introduzir uma segunda paleta paralela.

| Token | Uso |
|---|---|
| `color.background` | Fundo principal |
| `color.surface` | Cards, painéis e menus |
| `color.text.primary` | Texto principal |
| `color.text.secondary` | Ajuda e metadados |
| `color.border` | Divisórias e contornos |
| `color.primary` | Ação primária e foco |
| `color.success` | Confirmação de sucesso real |
| `color.warning` | Atenção necessária |
| `color.danger` | Erro ou ação destrutiva |
| `radius.control` | Campos e botões |
| `radius.panel` | Cards e painéis |
| `space.*` | Escala consistente de espaçamento |
| `type.*` | Escala de tamanhos e pesos tipográficos |

## 4. Componentes essenciais

- Botão primário, secundário, terciário e destrutivo.
- Campo de texto, textarea, seletor de arquivo e entrada de foto/câmera.
- Card de projeto e card/visualizador de render.
- Indicador de carregamento, estado vazio, aviso e erro recuperável.
- Diálogo de confirmação para ações destrutivas.
- Navegação adaptada à largura da tela.
- Histórico de imagens/versões, caso já suportado pelo produto.

## 5. Estados de interface

Todo componente assíncrono relevante deve considerar: ocioso, carregando, sucesso, vazio e erro. Em operações de IA, indicar a etapa real quando disponível; não mostrar “render concluído” antes de imagem válida e persistência confirmada.

## 6. Acessibilidade e responsividade

- Contraste legível e foco de teclado visível.
- Controles com rótulos acessíveis e áreas de toque adequadas.
- Não depender apenas de cor para comunicar estado.
- Não ocultar ações críticas em hover, pois isso não funciona em telas táteis.
- Evitar que o preview da imagem ou os botões de ação extrapolem a largura do celular.

## 7. Regras para mudanças visuais

1. Inspecionar tokens, CSS global e componentes existentes.
2. Preferir mudanças pequenas e reutilizáveis.
3. Não redesenhar o fluxo de renderização na mesma alteração que muda o design, salvo necessidade justificada.
4. Conferir pelo menos uma largura móvel e uma de desktop.
5. Registrar divergências conhecidas em vez de declarar consistência sem inspeção.
