# n8n verification pack — n8n-nodes-agent-grove

Maps every n8n community-node verification requirement (research notes
`N8N-NODE-AUTHORING-2026-09-12.md` §6 checklist and
`N8N-INSTALL-AND-HARNESS-2026-09-12.md` Q2, both 2026-09-12) to how this
package satisfies it, with the per-requirement command outputs. Anything not
done yet is marked **TODO** with the owner.

## Automated checks (run on this working tree, 2026-09-12)

| Command | Result |
|---|---|
| `npm install` | 0 (696 packages) |
| `npm run build` | 0 ("✓ Build successful") |
| `npm run lint` | 0 (n8n-node lint, manifest + community-node rules pass) |
| `npm test` | 0 (10 pass, 0 fail) |
| `npm pack --dry-run` | 0 (12 files, see below) |
| `npx @n8n/scan-community-package n8n-nodes-agent-grove` | PASS on 0.1.1 (2026-09-12) — see "Post-publish scanner result" below |

## Requirement → evidence

| # | n8n requirement | How this package satisfies it | Status |
|---|---|---|---|
| 1 | Not a duplicate of an existing node; one third-party service per package | Package integrates exactly Agent Grove (agent-grove.com) | OK |
| 2 | No logic / flow-control nodes | Single integration node + credential | OK |
| 3 | Built with the n8n-node tool; automated checks pass | Built with `@n8n/node-cli` 0.48.2 (`npm run build`), lint + tests pass | OK |
| 4 | No external runtime dependencies | No `dependencies` in package.json; HTTP via `helpers.httpRequestWithAuthentication`; copied by the linter's `no-runtime-dependencies` rule | OK |
| 5 | No env-var or filesystem access in node code; data via parameters | Node reads only credential + node parameters | OK |
| 6 | npm repository URL matches expected repo; repo public; author/maintainer consistent | `repository` = https://github.com/automatry/n8n-nodes-agent-grove.git; author "Automatry Ltd" | OK (npm user `automatry`; repo `automatry/n8n-nodes-agent-grove` public)|
| 7 | License must be MIT | `license: "MIT"`, LICENSE file MIT | OK |
| 8 | Published from GitHub Actions with provenance (mandatory from May 1 2026) | `publish.yml` publishes release tags via GitHub Actions + Trusted Publishing | DONE — 0.1.1 published via GitHub Actions + Trusted Publishing with provenance (run 34695131127) |
| 9 | README/documentation with usage, examples, auth details | README.md ships in the tarball; `examples/run-agent.workflow.json` | OK |
| 10 | Error handling, validation, TypeScript, lint | `NodeApiError`/`NodeOperationError` in node code; strict TS; `npm run lint` 0 | OK |
| 11 | UX guidelines | Node in idiomatic n8n shape (dropdown, resource/operation pattern) | OK (per guideline reading; final judgment is n8n's) |
| 12 | English-only UI text and docs | Yes | OK |
| 13 | Submit via Creator Portal | https://creators.n8n.io/nodes after publish | **TODO (Rich)** |
| 14 | No competition with n8n paid features | Relays to a third-party agent host only | OK |

## Publishing steps (provenance path)

1. **npm Trusted Publishers (one-time, Rich):** on npmjs.com → account →
   Publish Access → Trusted Publishers → GitHub Actions: owner `automatry`,
   repo `n8n-nodes-agent-grove`, workflow filename `publish.yml` (the filename,
   not the workflow `name:`). **Configured 2026-09-12; no npm token is stored
   in the repository.** Alternative: a granular npm token in the repo's
   `NPM_TOKEN` Actions secret.
2. **Public repo (Rich):** `automatry/n8n-nodes-agent-grove` on GitHub must be
   public before submission; the npm tarball's `repository` URL already points
   at it. **Done 2026-09-12** — the repo is public (npm rejects provenance for
   private source repositories: E422 "Unsupported GitHub Actions source
   repository visibility: private").
3. **Publish:** merge to `main`, then add a `CHANGELOG.md` entry, run
   `npm version --no-git-tag-version patch`, commit `package.json` +
   `package-lock.json` + `CHANGELOG.md` as `release: <version>`,
   `git tag -a <version> -m <version>` and `git push origin main --follow-tags`;
   the `publish.yml` workflow publishes to npm with a provenance statement via
   Trusted Publishing. Do NOT use `npm run release` — release-it runs
   `auto-changelog`, which would overwrite the hand-written `CHANGELOG.md`.
   Tags carry no `v` prefix (workflow filter `*.*.*`).
4. **Post-publish scanner:** `npx @n8n/scan-community-package n8n-nodes-agent-grove`
   (resolves the published tarball; must pass before the Creator Portal
   submission). Passed on 0.1.1, 2026-09-12 (output below).
5. **Submit:** at https://creators.n8n.io/nodes (register/login) → verify
   community node. Review turnaround is not documented by n8n.

## Post-publish scanner result (0.1.1, 2026-09-12)

```
Checking provenance for n8n-nodes-agent-grove@0.1.1...✅ Provenance check passed for n8n-nodes-agent-grove@0.1.1
Fetching source for n8n-nodes-agent-grove@0.1.1...✅ Fetched source from github.com/automatry/n8n-nodes-agent-grove@e9ca2a7
Downloading n8n-nodes-agent-grove@0.1.1...✅ Downloaded n8n-nodes-agent-grove@0.1.1
Analyzing n8n-nodes-agent-grove@0.1.1...✅ Analyzed n8n-nodes-agent-grove@0.1.1
✅ Package n8n-nodes-agent-grove@0.1.1 has passed all security checks
```

Registry `dist.attestations` on 0.1.1: SLSA provenance v1 + npm publish
attestation v0.1 (sigstore transparency log index 2807884357). Dist-tag
`latest` = 0.1.1.

## Published versions

- **0.1.0** (2026-09-12) — bootstrap, published manually from the maintainer's
  machine, **no provenance** (required because npm Trusted Publishing can only
  be configured on an existing package).
- **0.1.1** (2026-09-12) — published from GitHub Actions (`publish.yml`,
  workflow run 34695131127, source commit e9ca2a7) via npm Trusted Publishing
  (OIDC) **with a provenance attestation**; dist-tag `latest`.
