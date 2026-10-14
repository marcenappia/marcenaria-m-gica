# Marcenaria Mágica — agentes de revisão

Estes playbooks definem papéis especializados para orientar a execução e revisão do trabalho. Eles não iniciam agentes autônomos por conta própria: o coordenador (assistente) deve aplicar os checklists relevantes e registrar evidências verificáveis.

## Papéis

- [Coordenador de Engenharia](coordinator.md): escopo, sequência, risco, decisão e relatório.
- [Especialista em Render e Storage](render-storage.md): preservação do fluxo crítico de imagem.
- [Qualidade e Segurança](quality-security.md): testes, tipagem, autenticação, RLS e segredos.
- [Release e Verificação](release-verification.md): CI, SHA publicado, smoke test e prova de deploy.
- [UX e Produto](ux-product.md): clareza do fluxo de trabalho sem regressões.

## Regra de evidência

Cada item deve receber um destes estados: **PASSOU** (com link/log/resultado), **FALHOU** (com erro observado), **BLOQUEADO** (causa identificada), ou **NÃO VERIFICADO** (não há evidência suficiente). Não converter “não verificado” em “passou”.
