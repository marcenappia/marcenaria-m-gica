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

## Engineering team workflow

Use the role-based agent playbooks under `docs/agents/` as mandatory review roles. They are review checklists and operating instructions, not a claim that separate autonomous agents are running in the background. For any meaningful change, run the Coordinator workflow and collect independent findings from the relevant roles before declaring completion.

1. **Coordinator:** defines the change, risk, acceptance criteria, and evidence checklist.
2. **Render & Storage specialist:** protects the photo → provider → durable Storage → project linkage → reload path.
3. **Quality & Security reviewer:** reviews types, lint, tests, secrets, auth, RLS, and failure handling.
4. **Release & Verification reviewer:** confirms the exact commit, CI checks, deployment SHA/state, and smoke-test evidence.
5. **UX & Product reviewer:** checks user workflow and accessibility without disrupting the proven render path.

If a role cannot verify something with available tools, mark it as **not verified**; never invent test results. Resolve disagreements with code and logs, not assumptions.

## Project documentation and change safety

Before changing product behavior, read the relevant documents in `docs/`, starting with `docs/README.md`. Treat `docs/PRD.md` as the product intent, `docs/ARCHITECTURE.md` as the system boundary map, and `docs/IMPLEMENTATION_TEST_PLAN.md` as the release checklist. Where documentation conflicts with observed code or infrastructure, report the discrepancy and update the documentation after verifying the source of truth.

### Critical render flow

Preserve the real-photo render/edit path. Do not replace or remove the working render pipeline as part of unrelated UI cleanup. Before changing AI providers, image request/response formats, storage, or project-image relationships, inspect the complete path and add/run regression tests. Never claim end-to-end success without evidence for provider response, durable storage, project linkage, and reload visibility.

### Secrets and paid services

Never commit secrets or ask the user to paste them into chat. Do not commit secret values or expose them in logs. Do not make potentially paid AI calls or enable billing without explicit user authorization. A configured environment-variable name does not prove its value is valid or the provider is accessible.

### Evidence in reports

List files changed, tests actually run, exact commit SHA, deployment URL/state when checked, and unresolved blockers. Clearly distinguish verified facts from assumptions and planned work. CI lint with Prettier disabled does not count as repository-wide formatting completion.

### Required release gate

Do not call a task “complete” until the acceptance criteria pass. For render changes, separately report: (a) CI/unit checks, (b) deployment of the exact commit, (c) actual photo-to-render provider call authorized by the user, (d) durable Storage object, (e) database/project association, and (f) reopening the project and seeing the image. Billing/access failures are blockers, not successful tests.
