# Auditoria de engenharia — 2026-10-13

## Escopo verificado

Leitura estática de `src/lib/ai.server.ts`, `src/lib/projects.functions.ts`, `src/lib/cabinets.ts`, `package.json` e testes existentes na branch `feat/magic-fast-studio`. Esta é uma auditoria parcial do código-fonte; não equivale a execução local, teste E2E ou inspeção completa das políticas remotas do Supabase.

## Achados

### P0 — Provedor de render bloqueado por billing (confirmado em runtime pelo relato do usuário)

- A configuração seleciona Vercel AI Gateway quando encontra `AI_GATEWAY_API_KEY`, `VERCEL_AI_GATEWAY_API_KEY` ou `VERCEL_OIDC_TOKEN`.
- O Gateway respondeu exigindo cartão válido para atender requisições.
- Impacto: análise/render através desse caminho pode falhar antes de gerar imagem.
- Tratamento: não repetir chamadas pagas, não cadastrar cartão automaticamente e não trocar de provedor sem confirmar credencial, endpoint e suporte a edição de imagem.

### P1 — Falha ao atualizar o projeto após edição podia deixar arquivo órfão (confirmado por inspeção estática; corrigido nesta branch)

- `editRender` fazia upload de uma nova versão para Storage e, se o update da linha do projeto falhasse, retornava erro sem remover o arquivo recém-enviado.
- Correção: tentar remover o novo objeto quando o vínculo no banco falha, seguindo o padrão já usado por `renderProject`. A remoção é best-effort; falhas de Storage ainda precisam ser monitoradas.

### P1 — Separação entre linhas no prompt de edição (confirmado por inspeção estática; corrigido nesta branch)

- O prompt de edição juntava instruções com a string literal `"\\n"`, enviando barras invertidas e a letra n em vez de separadores de linha reais.
- Correção: usar `"\n"` para delimitar instruções.

### P1 — Cobertura automatizada de classificação de erros de IA insuficiente (lacuna de testes; teste adicionado)

- Foi criado `src/lib/ai.server.test.ts` para cobrir mensagens de 401, 402, 403 e 429 e a classe `AiError`.
- Esses testes ainda precisam ser executados em CI/ambiente de build antes de considerar a alteração validada.

### P1 — Atualização de status sem verificação explícita de erro (a verificar)

- `analyzeProject` e `renderProject` tentam marcar a operação como `running` antes do bloco principal, mas ignoram o objeto de erro retornado por Supabase.
- Avaliar tratamento robusto para falha ao atualizar status, respeitando RLS e evitando mascarar a falha original. Não alterado nesta etapa para limitar o risco.

### P1 — Integridade do histórico de versões (a verificar)

- `editRender` guarda histórico no JSON de análise e limita a lista a 20 versões; `restoreRenderVersion` valida prefixo do caminho e presença no histórico.
- Ainda falta teste integrado para existência real do objeto, falhas de remoção/Storage, concorrência de duas edições e políticas de acesso.

## Comandos e scripts disponíveis

O `package.json` define `npm test` (Vitest), `npm run lint` (ESLint) e `npm run build` (Vite). Nesta etapa, os scripts foram identificados por inspeção do arquivo, mas **não foram executados localmente**. O resultado de build/publicação deve ser consultado separadamente.

## Próxima sequência

1. Executar testes, lint e build na branch atual.
2. Verificar o deployment Preview e os logs de build.
3. Corrigir os achados restantes com testes de regressão.
4. Resolver acesso ao provedor sem chamada paga não autorizada.
5. Somente depois, executar um teste manual autorizado de ponta a ponta: foto → análise → edição/render → Storage → vínculo no projeto → reabertura após recarregar.

## Regra de conclusão

Não declarar o fluxo de renderização operacional com base apenas em commit ou deployment READY. Exigir evidência da geração real e da persistência.
