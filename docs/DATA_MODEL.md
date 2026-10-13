# Modelo de dados

**Status:** contrato conceitual; nomes, colunas, tipos, constraints e políticas devem ser confirmados no schema real do Supabase antes de migrations.

## 1. Entidades lógicas

### Usuário / identidade
Representa a identidade autenticada. A fonte exata e os claims devem seguir a configuração atual do Supabase Auth.

### Projeto
Representa um trabalho de marcenaria e seu contexto. Deve ter proprietário ou regra de acesso equivalente, nome/título e timestamps conforme schema existente.

### Imagem do projeto
Representa foto original, render ou versão editada. Deve estar vinculada ao projeto e distinguir a função/tipo da imagem. Para arquivos persistidos, armazenar referência durável ao Storage, não uma URL `blob:` temporária.

### Operação de IA (recomendação)
Representa uma execução de análise ou render para auditoria: projeto, tipo da operação, estado, timestamps, código de erro categorizado e metadados não sensíveis. Só introduzir essa entidade após comparar com tabelas e logs já existentes.

### Preferências e referências da marcenaria (futuro)
Pode reunir materiais, padrões, fornecedores e documentos de referência, sempre com limites de acesso explícitos.

## 2. Invariantes

- Cada render persistido deve apontar para o projeto correto.
- O usuário só pode consultar ou alterar projetos/imagens para os quais tenha autorização.
- A imagem original deve ser preservada quando uma nova versão é criada.
- Uma falha de geração ou upload não deve produzir um registro de sucesso falso.
- Referências ao Storage devem ser estáveis e recuperáveis.
- Dados sensíveis e segredos de integração nunca devem ser armazenados em metadados públicos.

## 3. Auditoria obrigatória antes de mudar schema

1. Inspecionar migrations e schema remoto.
2. Inventariar tabelas e colunas efetivamente utilizadas no código.
3. Verificar chaves estrangeiras, índices, constraints e triggers.
4. Auditar RLS/policies e testar acessos entre usuários diferentes.
5. Conferir buckets, políticas de Storage e caminhos de objetos.
6. Comparar o uso real com os tipos gerados, se houver.
7. Planejar migração reversível e compatível com dados atuais.

## 4. Itens conhecidos a conferir

O histórico do projeto cita `gallery_images`, `project_id`, `storage_path` e metadados de ambiente. Confirmar se esses nomes e estruturas continuam presentes na branch e no banco conectado. Não criar tabelas duplicadas nem presumir que os nomes citados descrevem o schema atual.

## 5. Regra de privacidade

Não incluir dados reais de clientes, URLs privadas, chaves, tokens ou imagens de cliente em fixtures, documentação ou logs. Usar dados sintéticos nos testes.
