# APIs e integrações

**Status:** contratos desejados e configuração observada; validar com implementação e documentação do provedor antes de trocar endpoints/modelos.

## 1. Operações lógicas

### Análise de ambiente
**Entrada:** instrução do usuário e foto de referência.  
**Saída esperada:** descrição do ambiente, elementos existentes, restrições, proposta, estimativas visuais, pendências, riscos e prompt para render.  
**Regras:** não afirmar medidas exatas inferidas somente por foto; tratar JSON/resposta como dado não confiável e validar estrutura antes de usar.

### Geração/edição de imagem
**Entrada:** instrução de edição e imagem original/de referência.  
**Saída esperada:** imagem decodificável e validada, com tipo/tamanho aceitável.  
**Regras:** confirmar que o endpoint e modelo suportam edição com imagem de referência; não assumir que um endpoint de geração aceita o mesmo formato de outro provedor.

### Persistência de imagem
**Entrada:** bytes validados, projeto autorizado e metadados mínimos.  
**Saída esperada:** objeto persistido, referência durável e registro vinculado ao projeto.  
**Regras:** upload e gravação de registro devem ter tratamento de falha; não persistir `blob:` como URL definitiva.

## 2. Provedor configurado no código observado

O módulo `src/lib/ai.server.ts` define caminhos para o Gateway Lovable e Vercel AI Gateway. No caminho Vercel, foram observados os modelos `alibaba/qwen3.7-flash` para análise e `openai/gpt-image-2.5-sunburst` para render.

**Bloqueio atual conhecido:** a chamada ao Vercel AI Gateway retornou erro de acesso informando que é necessário ter cartão válido cadastrado para usar o serviço. Não repetir chamadas pagas como tentativa de diagnóstico. Não considerar o fluxo operacional até resolver autorização/billing ou configurar outro provedor compatível.

## 3. Contrato de erros

A aplicação deve distinguir, no mínimo:

- Credencial ausente ou inválida (401).
- Crédito/billing/autorização (402/403 conforme resposta real).
- Limite de requisições (429).
- Timeout/rede (erro transitório).
- Resposta vazia, estrutura inválida ou imagem inválida.
- Falha de upload ou de gravação do registro.
- Projeto inexistente ou acesso negado.

Mensagens para o usuário devem ser claras e não expor tokens, headers ou detalhes internos sensíveis. Logs técnicos devem registrar status, etapa, duração e identificador de operação, sem segredos.

## 4. Variáveis de ambiente

O código observado consulta nomes como `AI_GATEWAY_API_KEY`, `VERCEL_AI_GATEWAY_API_KEY`, `VERCEL_OIDC_TOKEN` e `LOVABLE_API_KEY`. A presença de um nome no painel não comprova validade. Valores reais nunca devem ser colocados neste documento, em commits, logs ou conversas.

Manter matriz por ambiente com: nome da variável, finalidade, ambiente/branch, origem e data de validação. Nunca registrar o valor.

## 5. Checklist para um novo provedor

- Suporta entrada multimodal com imagem?
- Suporta edição da imagem original ou apenas criação a partir de texto?
- Qual endpoint, modelo e formato exato de entrada/saída?
- Como autenticar no ambiente de produção?
- Quais limites, custos e condições de billing?
- Quais políticas de retenção e uso de dados?
- Como validar resposta, MIME type, tamanho e segurança?
- Há teste manual autorizado e teste automatizado sem custo inesperado?

Só habilitar um provedor após responder a esses itens. Não implementar fallback automático para um serviço que não tenha credenciais e compatibilidade confirmadas.
