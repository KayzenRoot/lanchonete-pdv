# QA-BOOTSTRAP-001 · Free security pilot

Status: **PROPOSED / NOT APPROVED**. Companion issue: [#1](https://github.com/KayzenRoot/lanchonete-pdv/issues/1).

## OBJECTIVE
Introduce narrowly scoped free quality/security automation in this existing public repository, without changing application code, production configuration or databases.

## CONTEXT / SOURCE CHECK
- Base branch: `main`; Context Lock base SHA: `b69e1aeca4fba293abe6c0a29847704876158763`.
- Inspected: `README.md`, root `package.json`, `api/package.json`, `web/package.json`, `.gitignore`, the `api/` and `web/` root trees, and existing GitHub workflow list (none found).
- The existing README documents test credentials; **verify that production credentials are unique and rotated**. No assumption is made about their real-world validity.
- Preserve existing project workflow. No new Source Pack is imposed on this brownfield project.

## SCOPE (NECESSARY)
- Add a SHA-pinned, least-privilege GitHub Actions workflow: Gitleaks v3 on commits (blocking when leaks are detected); Trivy filesystem vulnerability/misconfiguration scan (report-only for the initial legacy baseline).
- Add Renovate configuration for weekly updates, two concurrent PRs maximum, no auto-merge.
- Observe workflow results at the exact PR head and classify findings before strengthening gates.

## OUT OF SCOPE
Runtime changes, authentication changes, remediation of existing findings, database migrations, deployment, production release, branch rule changes, secret rotation, mass installation across other repositories, external SaaS authorization, Codecov coverage upload or paid services.

## REQUIREMENTS / ARCHITECTURE RULES
- Do not introduce credentials into repo, CI scripts or log outputs intentionally.
- Preserve existing build and deploy behavior; no workflow in this increment deploys or mutates runtime state.
- Pin third-party Actions to verified commit SHAs; use `contents: read` and no write permissions.
- Keep Trivy informational initially to avoid representing historic vulnerability debt as a clean bill of health.
- This PR cannot authorize a production release or automatically merge dependencies.

## ACCEPTANCE CRITERIA
1. Workflow YAML and Renovate JSON are syntactically valid, and Action SHAs match upstream release tags.
2. Two dedicated jobs execute on the PR candidate; inspect run URL, status and logs.
3. Gitleaks findings are treated as blocking until triaged; real secrets require rotation even if removed from current files.
4. Trivy findings are recorded and triaged before a future Work Order introduces a blocking threshold.
5. Final independent audit compares base and exact head and confirms no runtime changes.

## TESTS / EVIDENCE
- Static validation: YAML structure, JSON parse, upstream release SHA checks and diff boundaries.
- Runtime verification: GitHub Actions `Gitleaks (blocking)` and `Trivy (report-only baseline)` at exact PR head.
- Collect errors without copying raw secret candidates into issues, PR comments or documentation.
- Record external SaaS integration results only when visible in GitHub PR checks; Chrome sign-in alone does not prove access from this session.

## DELIVERABLES / REVIEW FORMAT
Issue #1, dedicated branch, this Work Order, pinned scanner workflow, Renovate configuration, draft PR; review in Brazilian Portuguese, with base/head SHAs, checks, findings, risks and proposed Checkpoint Delta.

## STOP CONDITION / PROPOSED CHECKPOINT DELTA
No merge or promotion until scanner results and independent audit justify **APPROVED**. On failure or uncertainty, remain **CORRECTION REQUIRED** or **BLOCKED**, correct on the same PR, and rerun exact-head checks. A successful workflow does not prove the entire legacy application is secure, tested or production-ready.

## FOLLOW-UP (NOT THIS INCREMENT)
After this pilot passes, individually connect and validate CodeRabbit (public eligible repos), SonarQube Cloud, Codecov when coverage exists, Sentry when runtime instrumentation is appropriate, and extra analyzers only when their free-tier quotas and findings add value.
