# PRD — Product Requirements Document

**Produto:** Marcenaria Mágica  
**Status:** Base inicial; validar requisitos e lacunas com o produto em execução.

## 1. Visão

A Marcenaria Mágica ajuda profissionais de marcenaria a transformar fotos e instruções de clientes em propostas visuais de móveis sob medida, permitindo demonstrar e iterar a ideia antes da execução.

## 2. Público principal

- Marceneiros e donos de marcenarias.
- Projetistas e profissionais que apresentam propostas aos clientes.
- Equipe interna que configura materiais, referências e dados da marcenaria.

## 3. Problema

Criar uma proposta visual convincente a partir de um ambiente real costuma exigir ferramentas especializadas, tempo e várias trocas de informação. O produto deve simplificar esse processo sem sugerir que uma foto substitui medição técnica presencial.

## 4. Jornada principal

1. Usuário entra na aplicação e inicia ou abre um projeto.
2. Envia uma foto do ambiente ou captura uma imagem pelo celular, quando o dispositivo e a interface oferecem essa opção.
3. Descreve em linguagem natural o móvel ou a alteração desejada.
4. O sistema analisa a solicitação e, quando necessário, identifica medidas e decisões que precisam ser confirmadas.
5. O serviço de imagem gera uma proposta integrada à foto original.
6. O usuário visualiza a imagem, abre/amplia para apresentar ao cliente e solicita ajustes.
7. Projeto e imagens são persistidos e podem ser consultados novamente.

## 5. Requisitos funcionais

- **RF-01 — Projetos:** iniciar, abrir e identificar o projeto ao qual cada imagem pertence.
- **RF-02 — Entrada visual:** permitir selecionar uma foto e, quando suportado, capturar diretamente pela câmera do celular.
- **RF-03 — Instruções naturais:** aceitar solicitações de criação e edição sem exigir comandos rígidos.
- **RF-04 — Preservação do ambiente:** manter, tanto quanto possível, paredes, aberturas, piso, perspectiva e iluminação da foto original.
- **RF-05 — Iteração:** permitir pedir mudanças específicas no render existente, sem reinterpretar desnecessariamente o restante do projeto.
- **RF-06 — Visualização:** apresentar o resultado com opção de abrir/ampliar a imagem.
- **RF-07 — Persistência:** armazenar imagens geradas em armazenamento durável e relacioná-las ao projeto correto; nunca tratar URL local `blob:` como URL permanente.
- **RF-08 — Estado da operação:** comunicar carregamento, conclusão e falhas com mensagens claras, sem deixar o usuário preso em carregamento infinito.
- **RF-09 — Segurança:** proteger projetos e imagens de usuários não autorizados.
- **RF-10 — Orientação técnica:** não afirmar medidas exatas inferidas apenas da foto; destacar estimativas e itens que exigem conferência.
- **RF-11 — Materiais e referências:** permitir que evoluções futuras usem referências de materiais, fornecedores e preferências da marcenaria, sem comprometer a jornada central.
- **RF-12 — Responsividade:** experiência utilizável em celular e desktop.

## 6. Requisitos não funcionais

- **Confiabilidade:** erros de autenticação, armazenamento e provedor devem ser distinguíveis.
- **Desempenho:** informar progresso de forma honesta. Meta de produto desejada para render: até 30 segundos quando a infraestrutura permitir; medir p50/p95 antes de assumir esse SLA.
- **Segurança:** credenciais apenas no servidor/gerenciador de segredos; validação de entrada e autorização por projeto.
- **Manutenibilidade:** módulos e integrações com contratos explícitos e testes.
- **Custo controlado:** identificar provedor/modelo e tratar limites e falhas de faturamento sem tentar repetidamente chamadas pagas.
- **Acessibilidade:** rótulos compreensíveis, foco visível e controles utilizáveis em telas pequenas.

## 7. Fora de escopo até decisão explícita

- Usar renders como garantia de medidas ou de viabilidade construtiva.
- Alterar automaticamente o provedor de IA sem credencial válida e sem verificar compatibilidade.
- Reescrever o pipeline de renderização apenas para reorganizar a interface.
- Prometer disponibilidade ou custo de um provedor externo sem confirmação.

## 8. Critérios de aceite do fluxo crítico

Uma execução só é considerada ponta a ponta quando houver evidência de:

1. Foto e instrução recebidas.
2. Análise executada, quando necessária.
3. Provedor de imagem chamado e resposta validada.
4. Imagem resultante válida.
5. Upload para armazenamento persistente.
6. Registro relacionado ao projeto correto.
7. Imagem visível ao usuário após recarregar a página.
8. Falhas comunicadas sem perda do original nem falsa mensagem de sucesso.

## 9. Métricas a acompanhar

- Taxa de sucesso de análise e render, separadamente.
- Tempo p50/p95 de cada etapa e tempo total.
- Percentual de renders persistidos e reabertos corretamente.
- Erros por categoria: credencial, billing, limite, timeout, resposta inválida e Storage.
- Custo por render, quando o provedor disponibilizar dados confiáveis.
