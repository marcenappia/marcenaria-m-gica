# Documentação da Marcenaria Mágica

Esta pasta reúne a fonte de referência do produto e da engenharia. Leia estes documentos antes de planejar mudanças que afetem comportamento, UI, dados, IA ou publicação.

## Documentos-base

1. [PRD — Requisitos do produto](./PRD.md)
2. [Design System](./DESIGN_SYSTEM.md)
3. [Arquitetura técnica](./ARCHITECTURE.md)
4. [Modelo de dados](./DATA_MODEL.md)
5. [APIs e integrações](./API_INTEGRATIONS.md)
6. [Plano de implementação e testes](./IMPLEMENTATION_TEST_PLAN.md)

## Ordem recomendada para novas tarefas

1. Entender o PRD e os critérios de aceite.
2. Consultar arquitetura, modelo de dados e contratos de integração relevantes.
3. Respeitar o Design System.
4. Implementar a menor alteração segura possível.
5. Executar testes e registrar evidências, limitações e riscos no PR.

## Estado e confiança

Estes documentos registram decisões e requisitos conhecidos a partir do histórico do produto e da inspeção parcial do repositório. Onde um detalhe do código, schema, serviço externo ou ambiente ainda não foi confirmado, ele está marcado como **a verificar**. Não trate hipótese como fato nem invente tabelas, endpoints, credenciais ou testes executados.

## Regra de preservação

A renderização baseada em foto real é um fluxo crítico. Não substituir, remover ou refatorar esse fluxo sem primeiro entender sua implementação atual, criar/rodar testes de regressão e demonstrar que o caminho completo continua funcionando.

## Auditoria de engenharia

- [Auditoria inicial e achados verificados](./ENGINEERING_AUDIT.md)
