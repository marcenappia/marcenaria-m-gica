# Endpoint de render para o Marcenapp

A Marcenaria Mágica continua responsável pelo motor de render. O Marcenapp continua responsável por autenticação do usuário, créditos, projetos, Storage e histórico.

## Configuração do servidor

Defina no ambiente server-side da Marcenaria Mágica:

```bash
LOVABLE_API_KEY=<chave-do-gateway-de-ia>
MARCENARIA_MAGICA_RENDER_SECRET=<segredo-compartilhado-com-o-marcenapp>
```

Nunca use `VITE_` para essas variáveis.

## Endpoint

`POST /api/marcenaria-render`

Header obrigatório:

```text
X-Marcenapp-Render-Secret: <MARCENARIA_MAGICA_RENDER_SECRET>
```

Payload:

```json
{
  "prompt": "Photorealistic interior design render...",
  "image": {
    "mimeType": "image/jpeg",
    "data": "<base64-sem-prefixo-data-url>"
  }
}
```

Resposta de sucesso:

```json
{
  "imageBase64": "data:image/png;base64,...",
  "model": "openai/gpt-image-2.5-sunburst"
}
```

O endpoint valida o segredo, o tamanho do payload, o MIME da referência e o prompt. Ele não expõe `LOVABLE_API_KEY` e não recebe credenciais do usuário do Marcenapp.

## Publicação

Depois do deploy, configure no Supabase do Marcenapp:

```bash
supabase secrets set \
  MARCENARIA_MAGICA_RENDER_URL="https://<dominio-da-marcenaria-magica>/api/marcenaria-render" \
  MARCENARIA_MAGICA_RENDER_SECRET="<mesmo-segredo-do-servidor-da-marcenaria-magica>"
```

A chamada de teste deve ser feita server-to-server e com uma imagem de referência autorizada. Um `200` deve conter `imageBase64` iniciando em `data:image/`.
