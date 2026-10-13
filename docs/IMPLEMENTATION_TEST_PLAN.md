# Plano de implementação e testes

## 1. Princípios de trabalho

- Fazer auditoria antes de editar.
- Preservar comportamento comprovadamente funcional.
- Dividir mudanças por objetivo e manter commits pequenos.
- Não afirmar que build, testes, deploy ou render foram validados sem executar e observar o resultado.
- Não consumir créditos de IA nem iniciar operações potencialmente pagas sem autorização explícita.
- Nunca incluir segredos nos commits.

## 2. Prioridades

### P0 — Integridade do render
- Diagnosticar a etapa exata da falha e o status HTTP.
- Resolver acesso ao provedor sem descartar a implementação existente.
- Validar imagem de entrada, resposta do modelo e imagem de saída.
- Confirmar upload durável, registro relacionado ao projeto e reabertura após refresh.
- Garantir mensagens de erro e preservação da foto original.

### P1 — Confiabilidade e experiência
- Estados de carregamento, sucesso e erro consistentes.
- Câmera móvel e upload com validação de formato/tamanho.
- Visualização/ampliação do render e iteração de edição.
- Autorização e políticas de acesso a projetos/imagens.
- Logs seguros e medição de duração por etapa.

### P2 — Organização e expansão
- Consolidar Design System e documentação.
- Evoluir referências de materiais, fornecedores e preferências.
- Melhorias de navegação e dashboard, com testes responsivos.

## 3. Testes mínimos por alteração

### Qualidade estática
- Executar scripts existentes de lint, typecheck, testes e build conforme `package.json`.
- Se algum script não existir ou não puder ser executado, registrar isso explicitamente.

### Análise de imagem
- Foto válida e instrução válida.
- Imagem ausente ou formato não suportado.
- Resposta malformada do provedor.
- Credencial inválida, erro de billing e limite.
- Garantir que erros não sejam convertidos em falso sucesso.

### Render
- Criação a partir de foto original.
- Edição localizada sem perder o restante do ambiente.
- Resposta sem imagem ou com dados inválidos.
- Timeout/erro de provedor.
- Garantir que foto original permaneça acessível.

### Persistência
- Upload com sucesso e obtenção de referência durável.
- Falha de upload.
- Falha ao gravar metadados.
- Recarregar a página e reabrir projeto/imagem.
- Verificar que o ativo pertence ao projeto correto e que usuários não autorizados não o acessam.

### Interface
- Celular e desktop.
- Estado vazio, carregando, sucesso e erro.
- Navegação por teclado, foco e rótulos acessíveis.
- Imagem e controles sem overflow em tela pequena.

## 4. Critério de liberação

Não declarar P0 resolvido até que uma execução real autorizada comprove: entrada → análise (se aplicável) → geração/edição → Storage → registro → visualização após recarregar. Uma implantação em estado READY comprova apenas a publicação do artefato, não o sucesso da integração externa.

## 5. Evidências por entrega

Registrar no PR/relatório:
- Branch e commit.
- Arquivos alterados.
- Comandos executados e resultado.
- Testes manuais realizados.
- Ambiente e URL testados, quando aplicável.
- Erros remanescentes, riscos e passos de rollback.

## 6. Rollback

Antes de uma mudança de provedor, schema ou pipeline, identificar o commit anterior e o caminho para reverter. Evitar apagar objetos, tabelas, imagens ou configurações existentes como parte de uma tentativa de correção.
