# Skills da Marcenaria Mágica

As skills são regras de domínio locais e versionadas em `src/lib/design-skills.ts`; não são agentes remotos que rodam por conta própria.

## Skills ativas no fluxo

- **Design de interiores:** entra no prompt da renderização principal para harmonizar paleta, materiais, eletros, iluminação e decoração sem competir com a marcenaria.
- **Marcenaria técnica:** reforça medidas informadas, módulos, acessos, ventilação e incertezas técnicas.
- **Renderização e edição:** orienta a edição da foto original e as alterações localizadas do render aprovado.
- **Guia de decoração sem IA:** regras determinísticas usam ambiente, estilo e materiais já salvos para sugerir categorias e termos de pesquisa. Não faz chamada de IA, não gera imagem e não afirma marcas, preços ou disponibilidade.

## Limites explícitos

- O guia é uma consultoria preliminar; não substitui visita técnica, especificação executiva ou validação de instalação.
- Termos de pesquisa são referências, não links de produtos validados.
- Uma nova imagem/edição ainda consome os recursos do provedor de renderização.
- A integração com Yara/Marcenapp é uma etapa separada; este pacote não afirma que ela já esteja conectada.
