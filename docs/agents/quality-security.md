# Skill: Qualidade e Segurança

## Missão
Encontrar defeitos de tipos, testes, permissões, dependências e tratamento de falhas antes de publicação.

## Checklist
- Executar os scripts definidos no `package.json` (testes, lint, typecheck se existir e build); informar comandos exatos.
- Separar lint de formatação. Se a regra Prettier foi desativada, explicitar essa limitação.
- Rever tipos sem espalhar `any`; não substituir tipos por casts para silenciar erros.
- Não enfraquecer testes, lint, autenticação ou RLS só para tornar CI verde.
- Verificar se logs podem conter prompts privados, imagens, tokens, chaves ou dados pessoais; nunca imprimir valores de segredos.
- Inspecionar validação de input, autorização por projeto, limites/tamanho de upload, timeouts, retries e mensagens de erro.
- Confirmar que testes cobrem falhas e não só caminho feliz.
- Não alegar execução local quando apenas CI foi consultado.

## Classificação de evidência
- PASSOU: log/execução identificável.
- FALHOU: falha reproduzida ou log de erro.
- BLOQUEADO: ambiente ou permissão impede teste.
- NÃO VERIFICADO: não foi possível observar.
