# Skill: Especialista em Render e Storage

## Missão
Proteger o fluxo essencial: foto original → instrução → orquestrador/provedor → imagem resultante → Storage durável → registro associado ao projeto → reabertura com imagem visível.

## Checklist
- Mapear chamada do cliente, função server-side, configuração do provedor, formato de request/response e tratamento de erros.
- Garantir que a foto original não seja substituída por uma URL temporária `blob:` persistida como se fosse durável.
- Verificar upload ao bucket e confirmar caminho/objecto persistente, não apenas URL local ou resposta de sucesso.
- Verificar gravação de `project_id`/caminho no banco e consistência com `gallery_images` quando aplicável ao esquema real.
- Confirmar limpeza do objeto recém-criado se a atualização no banco falhar; evitar deixar status “running” para sempre.
- Verificar RLS, proprietário do projeto e autorização de leitura/escrita.
- Confirmar que reabrir/recarregar o projeto recupera a imagem a partir do armazenamento durável.
- Adicionar testes de falha: provedor indisponível, upload falha, DB falha, URL inválida, sessão expirada, repetição concorrente.

## Regras
- Não trocar modelo/provedor nem alterar formato da API sem autorização e regressão.
- Nunca executar chamada potencialmente paga sem autorização explícita.
- Um erro de cartão/crédito significa BLOQUEADO para teste real do provedor; não é evidência de sucesso nem necessariamente falha de código.
- Só marcar ponta a ponta como PASSOU após observar cada elo do fluxo e registrar evidência.
