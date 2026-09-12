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
| `npx @n8n/scan-community-package n8n-nodes-agent-grove` | **not runnable** — the scanner runs against a **published** npm package; run it after the first publish (below) |

## Requirement → evidence

| # | n8n requirement | How this package satisfies it | Status |
|---|---|---|---|
| 1 | Not a duplicate of an existing node; one third-party service per package | Package integrates exactly Agent Grove (agent-grove.com) | OK |
| 2 | No logic / flow-control nodes | Single integration node + credential | OK |
| 3 | Built with the n8n-node tool; automated checks pass | Built with `@n8n/node-cli` 0.48.2 (`npm run build`), lint + tests pass | OK |
| 4 | No external runtime dependencies | No `dependencies` in package.json; HTTP via `helpers.httpRequestWithAuthentication`; copied by the linter's `no-runtime-dependencies` rule | OK |
| 5 | No env-var or filesystem access in node code; data via parameters | Node reads only credential + node parameters | OK |
| 6 | npm repository URL matches expected repo; repo public; author/maintainer consistent | `repository` = https://github.com/automatry/n8n-nodes-agent-grove.git; author "Automatry Ltd" | **TODO (Rich: make repo public before npm publish)** |
| 7 | License must be MIT | `license: "MIT"`, LICENSE file MIT | OK |
| 8 | Published from GitHub Actions with provenance (mandatory from May 1 2026) | `.github/workflows/publish.yml` ships in the package (run `npm run release` to bump/tag/push; the workflow publishes) | OK (config) / **TODO (Rich: npm Trusted Publishers config — see below)** |
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
   not the workflow `name:`). Alternative: a granular npm token in the repo's
   `NPM_TOKEN` Actions secret.
2. **Public repo (Rich):** `automatry/n8n-nodes-agent-grove` on GitHub must be
   public before submission; the npm tarball's `repository` URL already points
   at it.
3. **Publish:** merge to `main`, run `npm run release` locally — release-it
   bumps/commits/tags/pushes and the `publish.yml` workflow publishes to npm
   with a provenance statement via `@n8n/node-cli` (`prepublishOnly` runs
   `n8n-node prerelease`; provenance requires `@n8n/node-cli >= 0.23.0` — we
   pin 0.48.2).
4. **Post-publish scanner:** `npx @n8n/scan-community-package n8n-nodes-agent-grove`
   (resolves the published tarball; must pass before the Creator Portal
   submission).
5. **Submit:** at https://creators.n8n.io/nodes (register/login) → verify
   community node. Review turnaround is not documented by n8n.
