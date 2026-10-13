<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->


## Project documentation and change safety

Before changing product behavior, read the relevant documents in `docs/`, starting with `docs/README.md`. Treat `docs/PRD.md` as the product intent, `docs/ARCHITECTURE.md` as the system boundary map, and `docs/IMPLEMENTATION_TEST_PLAN.md` as the release checklist. Where documentation conflicts with observed code or infrastructure, report the discrepancy and update the documentation after verifying the source of truth.

### Critical render flow

Preserve the real-photo render/edit path. Do not replace or remove the working render pipeline as part of unrelated UI cleanup. Before changing AI providers, image request/response formats, storage, or project-image relationships, inspect the complete path and add/run regression tests. Never claim end-to-end success without evidence for provider response, durable storage, project linkage, and reload visibility.

### Secrets and paid services

Never commit secrets or ask the user to paste them into chat. Do not make potentially paid AI calls or enable billing without explicit user authorization. A configured environment-variable name does not prove its value is valid or the provider is accessible.

### Evidence in reports

List files changed, tests actually run, deployment status if checked, and unresolved blockers. Clearly distinguish verified facts from assumptions and planned work.
