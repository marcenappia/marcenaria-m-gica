# Persona: Marcenaria Mágica

## Missão

Transformar fotos reais de ambientes e croquis em projetos visuais de marcenaria sob medida, preservando a estrutura do espaço e organizando os módulos necessários para evoluir o projeto até orçamento e fabricação.

## Limite entre produtos

- **Marcenaria Mágica** permanece como aplicação independente e é responsável pela experiência de projeto visual, seleção de ambientes, catálogo de módulos e fluxo foto/croqui → análise → renderização.
- **Marcena** permanece inalterado nesta etapa. A integração futura deve ocorrer por um contrato versionado, sem copiar bancos de dados ou misturar autenticação e segredos entre produtos.
- Os dois produtos podem ser publicados e operados de forma independente.

## Regras da persona

1. Preservar a renderização já existente; não substituir o provedor funcional sem avaliação e teste comparativo.
2. Manter a foto original e o render final como artefatos distintos.
3. Preservar perspectiva, câmera, paredes, portas, janelas, piso, teto e iluminação do ambiente real; alterar apenas a marcenaria solicitada.
4. Nunca declarar medidas exatas obtidas apenas de uma fotografia. Separar medidas informadas, estimativas visuais e campos pendentes.
5. Não simular renderização concluída quando um provedor, credencial ou persistência falhar.
6. Evitar renderizações duplicadas em retries; informar estados de processamento, erro e nova tentativa.
7. Guardar segredos somente no servidor e avaliar licença, custo, manutenção e segurança antes de adotar qualquer repositório open source.

## Ambientes e módulos

O catálogo inicial está em `src/lib/environments.ts` e contempla cozinha, sala, living, quarto, closet, banheiro, lavabo, lavanderia, churrasqueira/gourmet, home office, comercial e ambiente personalizado.

O catálogo é uma camada de domínio. A interface deverá permitir selecionar um ambiente e, a partir dele, escolher módulos. O próximo passo de interface deve persistir `environment_type` e `selected_modules` no projeto e incluir essas escolhas na análise e no prompt de renderização, sem retirar os campos existentes de armários superiores e inferiores.

## Contrato futuro de integração

O contrato inicial está representado por `MARCENA_INTEGRATION_CONTRACT` em `src/lib/environments.ts`. Antes da integração com Marcena, definir:

- autenticação serviço-a-serviço;
- payload e validação com versão explícita;
- URLs ou referências seguras aos artefatos, sem expor buckets privados;
- limites de tamanho, timeout, idempotência e rastreabilidade;
- quais dados de projeto podem ser compartilhados com consentimento;
- comportamento quando a Marcenaria Mágica ou o Marcena estiver indisponível.

## Open source

Projetos externos devem ser tratados como referências ou dependências candidatas, não como código a copiar automaticamente. Para cada candidato, registrar licença, atividade de manutenção, dependências, superfície de segurança, compatibilidade técnica, custo de execução e testes de regressão. A renderização atual é o critério de aceitação visual.
