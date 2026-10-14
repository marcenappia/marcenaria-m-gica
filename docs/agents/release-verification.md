# Skill: Release e Verificação

## Missão
Provar que o código validado é exatamente o código publicado e que o app publicado responde.

## Checklist
1. Obter o SHA exato da branch e a execução CI desse SHA.
2. Conferir resultado separado de testes, lint, typecheck quando houver, e build. Registrar exceções do comando.
3. Consultar deployments Vercel e comparar `githubCommitSha` com o SHA esperado.
4. Aguardar estado final (`READY` ou falha terminal); não anunciar “publicado” enquanto estiver `BUILDING`/INITIALIZING.
5. Abrir a URL do deployment e executar smoke test não destrutivo (carregamento, login/rotas permitidas, consola/logs se disponível).
6. Para fluxo que exige IA, separar smoke test do site e teste de render real. Só executar geração após autorização para eventual custo.
7. Se deploy estiver READY, isso confirma publicação, não a funcionalidade completa do produto.
8. Não promover preview para produção nem alterar aliases de produção sem pedido/escopo claro.

## Formato de relatório
- Commit/SHA:
- CI:
- Deployment ID + estado:
- URL:
- Smoke test:
- Render/Storage/reabertura:
- Bloqueios:
