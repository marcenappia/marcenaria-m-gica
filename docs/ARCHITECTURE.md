# Arquitetura técnica

**Status:** mapa conceitual baseado no contexto disponível; confirmar cada caminho no código antes de uma refatoração.

## 1. Blocos lógicos

- **Interface:** telas de projetos, entrada de foto/instrução, estado de processamento e visualização do resultado.
- **Camada de servidor:** operações que exigem credenciais, chamadas a modelos, validação de respostas e regras de negócio.
- **Serviços de IA:** análise da foto/instrução e geração/edição de imagem. Devem ser etapas distinguíveis para diagnóstico.
- **Supabase:** autenticação, dados relacionais e armazenamento, conforme configuração real do projeto.
- **GitHub/Vercel:** código-fonte, integração contínua e publicação.

## 2. Caminho crítico de renderização

`foto + instrução → análise (se aplicável) → prompt de render → provedor de imagem → validação da imagem → Storage → registro do projeto/imagem → visualização`

Cada etapa deve ter logs seguros e erros categorizados. Não registrar tokens, conteúdo sensível desnecessário ou imagens codificadas em base64.

## 3. Implementação de IA conhecida

O módulo `src/lib/ai.server.ts` contém, na branch de referência, a seleção do provedor, a análise e a geração/edição de imagem. Os identificadores atuais observados incluem:

- Vercel AI Gateway: `https://ai-gateway.vercel.sh`
- Gateway Lovable: `https://ai.gateway.lovable.dev`
- Modelo de análise configurado para o caminho Vercel: `alibaba/qwen3.7-flash`
- Modelo de imagem configurado para o caminho Vercel: `openai/gpt-image-2.5-sunburst`

Esses valores descrevem a configuração encontrada, não garantem disponibilidade, autorização, compatibilidade atual ou saldo. O Gateway Vercel já retornou bloqueio de billing exigindo cartão; a geração por esse caminho não deve ser considerada funcional até teste real bem-sucedido.

## 4. Limites de responsabilidade

- Segredos e chamadas autenticadas: somente servidor.
- UI: exibe estado retornado pelo servidor; não inventa conclusão.
- Persistência: usar identificadores e URLs duráveis; URL temporária `blob:` não é um ativo persistido.
- Autorização: validar o usuário e a permissão sobre o projeto no servidor, não apenas esconder controles na UI.

## 5. Configuração e ambientes

- Separar Preview, Production e Development.
- Documentar quais variáveis são necessárias por provedor sem registrar valores secretos.
- Uma variável presente no painel não prova que a credencial é válida.
- Após alteração de ambiente, gerar nova implantação e verificar o ambiente efetivamente publicado.
- Não criar ou substituir credenciais automaticamente.

## 6. Resiliência e observabilidade

- Timeouts e limites definidos de forma explícita.
- Não fazer retries repetidos para erros de autenticação, billing ou autorização.
- Retry limitado apenas para falhas transitórias, com política documentada.
- Correlacionar etapas por um ID de operação sem incluir segredos.
- Diferenciar análise, geração, upload e gravação do registro.

## 7. Regras de evolução

- Evitar mudanças simultâneas de UI, provedor, esquema e pipeline.
- Preservar interfaces públicas e compatibilidade dos dados existentes.
- Antes de trocar um provedor, verificar entrada de imagem, saída, edição com imagem de referência, limites, custo e autenticação.
- Fazer alterações pequenas, revisáveis e com caminho de rollback.
