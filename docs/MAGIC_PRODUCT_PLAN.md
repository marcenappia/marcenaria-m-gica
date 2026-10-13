# Marcenaria Mágica — plano de produto e arquitetura

## Decisão de produto

Marcenaria Mágica é o produto principal. Não iniciar uma segunda aplicação nem migrar o usuário para outra estrutura neste ciclo. Preservar o fluxo de renderização já construído e evoluí-lo dentro do repositório atual. O objetivo de experiência é um “Promob digital por foto”: criar uma proposta visual com o cliente em minutos, sem montar paredes nem construir uma cena 3D do zero.

## Fluxo principal obrigatório

1. Capturar uma foto pelo celular ou selecionar uma imagem.
2. Escrever o pedido em linguagem natural; medidas são opcionais no início.
3. Salvar a foto original e criar o projeto.
4. Analisar ambiente, restrições, pedido e medidas conhecidas.
5. Editar a foto de referência para gerar a primeira proposta.
6. Salvar o render em Storage e registrar o caminho no projeto.
7. Exibir foto e render lado a lado.
8. Permitir pedir ajustes localizados em linguagem natural.
9. Salvar cada nova versão e permitir restaurar versões anteriores sem consumir nova geração.
10. Informar erros reais e oferecer nova tentativa; nunca simular um render bem-sucedido.

A foto original nunca deve ser substituída. As medidas lidas visualmente devem ser marcadas como estimativas; somente valores fornecidos ou conferidos pelo profissional são tratados como informados.

## Papéis de agentes

- **Intérprete do briefing:** converte a solicitação em requisitos e identifica ambiguidades.
- **Levantamento visual:** lista elementos existentes, restrições e medidas pendentes sem afirmar escala inexistente.
- **Projetista de marcenaria:** aplica módulos, portas, gavetas, ferragens, materiais, folgas e regras de fabricação.
- **Direção de interiores:** sugere materiais, cores e composição sem alterar itens fora do escopo.
- **Renderizador/editor:** usa a foto de referência e modifica apenas o que foi solicitado.
- **Crítico/verificador:** confere requisitos, presença da imagem final, gravação no Storage, atualização do banco e exibição no projeto.
- **Orquestrador:** executa somente as etapas necessárias, limita tentativas e registra falhas e custos.

Os agentes não devem ser criados como chatbots independentes sem ferramenta. Cada papel precisa ter entrada tipada, saída validável, limites, evidências e testes.

## Skills prioritárias

1. Preservação da foto original, perspectiva e arquitetura.
2. Briefing de cozinha, banheiro, closet, dormitório, lavanderia e ambientes comerciais.
3. Marcenaria brasileira: módulos, caixas, espessuras, portas, gavetas, folgas e ferragens.
4. Materiais e acabamentos comuns no Brasil: MDF, padrões madeirados, unicolores, pedras e metais.
5. Identificação de medidas informadas, estimadas e pendentes.
6. Edição localizada: mudar uma coisa por vez e preservar tudo o que não foi pedido.
7. Crítica visual: quantidade e posição de portas, módulos, eletrodomésticos, alinhamentos e materiais.
8. Preparação futura de orçamento, lista de peças e plano de corte, sempre a partir de dimensões confirmadas.

## Critérios de aceitação P0

- [ ] O projeto Supabase usado pela publicação está confirmado e acessível pela equipe autorizada.
- [ ] Upload original para o bucket `ambientes` funciona com a conta autenticada.
- [ ] Análise e render usam a credencial configurada para o provedor ativo.
- [ ] Streaming sem evento final tenta fallback não-streaming.
- [ ] Resposta sem imagem final gera erro explícito; não grava placeholder como imagem.
- [ ] Um render real é salvo no Storage e seu caminho é confirmado no registro do projeto.
- [ ] O render abre na interface após atualizar/reabrir o projeto.
- [ ] Uma edição subsequente salva outra versão e preserva a anterior.
- [ ] Testes cobrem sucesso, falha do provedor, falta de credencial, falha de upload e falha de gravação.
- [ ] A publicação de produção é identificada antes de qualquer deploy.

## Open source: plano de avaliação, não importação cega

- **Roomsmith** — https://github.com/Rumeasiyan/roomsmith  
  Avaliar padrões de levantamento, aprovação, crítica e relatórios. Antes de reutilizar código, confirmar o LICENSE e a licença de cada recurso/dataset no commit que será incorporado. Não portar o stack Python/Claude inteiro sem necessidade.
- **InteriorAgent** — https://github.com/KunalMGupta/interioragent  
  Avaliar arquitetura MCP, geometria e composição 3D para uma fase futura. Auditar licença de código, dados e ativos separadamente.
- **Room Redesign AI** — https://github.com/wassimdgh/room-redesign-ai  
  Avaliar a ideia de máscaras/segmentação para preservar partes da foto. Auditar dependências, pesos de modelos, GPU e licença dos datasets antes de qualquer incorporação.
- **Vercel AI SDK** — https://github.com/vercel/ai  
  Candidato para chamadas de ferramentas e orquestração TypeScript, desde que a adoção não desestabilize o fluxo de imagem atual.
- **Agent Skills** — https://github.com/anthropics/skills  
  Referência de estrutura e documentação de skills; verificar a licença por pasta e não presumir que todo exemplo/ativo tem os mesmos termos.

Não copiar bases inteiras nem baixar pesos/modelos automaticamente. Para cada dependência candidata, registrar licença SPDX, origem, versão/commit, dependências transitivas, uso comercial permitido, obrigações de atribuição e custo de hospedagem. Preferir adaptar padrões pequenos e verificáveis.

## Fases

- **P0 — Render confiável:** preservar a correção do fallback e provar foto → análise → render → Storage → UI.
- **P1 — Estúdio rápido:** foto + briefing + gerar render com um único comando; ajustes técnicos ficam opcionais.
- **P2 — Skills verificáveis:** instruções modulares e testes para tarefas recorrentes de marcenaria.
- **P3 — Agentes com ferramentas:** decomposição, crítica, validação e rastreabilidade.
- **P4 — Ferramentas de negócio:** orçamento, lista de materiais e plano de corte a partir de medidas confirmadas.
- **P5 — Geometria/segmentação avançada:** só após comprovar o valor e a estabilidade do fluxo principal.

## Segurança e operação

- Credenciais apenas no servidor; nunca enviar service-role keys ao navegador.
- Nunca mudar o projeto Supabase nem o destino de produção por inferência.
- Não publicar automaticamente num projeto Vercel que não tenha o repositório correto confirmado.
- Não prometer tempo fixo de geração sem medir a latência real.
- Cada teste que gera imagem deve ser identificado como teste de custo e executado com autorização/configuração válida.
