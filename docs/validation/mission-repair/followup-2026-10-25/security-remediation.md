# Audit and compatible dependency remediation — 2026-10-25

Full fresh npm registry audit: **11 vulnerable package records (2 critical, 6 high, 3 moderate) → 0**. Production-only final audit also **0**. This is an advisory database/lockfile result, not a penetration test or an assertion every listed advisory was exploitable in this application.

## Decision and scope

1. Patch the actual production framework: Next `16.3.5 → 16.4.3`, pin matching `eslint-config-next 16.4.3`; retain React `19.2.4`, Three `0.186.1` and the authored motion architecture. Installed Next requires Node `>=20.9.0`; package engines now states that actual minimum. Validation uses Node 22.22.3.
2. Update the existing **generator CLI**, `shadcn 4.1.0 → 4.22.1`, and correctly classify it as a development dependency (no application imports). Moving it is not the claimed fix for its advisories: the resolved SDK/Express/proxy-addr tree is patched too.
3. Run ordinary `npm audit fix` (no `--force`), which updates five remaining compatible packages for brace-expansion/source-map-js/Zod. No override, new application dependency, major framework change or suppressed advisory. Updated transitive packages are recorded in `dependency-paths-after.txt` and the lockfile; automatic compatible transitives under the changed CLI/linter include browser support metadata.
4. Validate the combined graph with lint, types, production build, units, route/assets and browser regression. Original cinematic failures remain failures, not dependency-upgrade acceptance passes.

Next's registry-recommended available fixed release 16.4.3 is compatible with Node >=20.9 and React 19. The CLI update stays within its existing major. The minimum vulnerable ranges and individual GHSA URLs are in `audit-before.json`; do not equate a package-level critical severity with every advisory in that record being critical.

## Exact affected installed versions and resolved paths

“Production-declared CLI” means the old package manifest put a tool into the production graph; this does **not** establish an internet-facing CLI service. The Next critical entry is a real runtime framework dependency. The proxy-addr critical entry is transitive under the generator's MCP/Express tools; no application Express server or proxy-addr import was found. Other tool transitive findings are development/build or generator scope, not an asserted browser exploit.

| Package | Severity | Before → after, actual installed path | Classification |
| --- | --- | --- | --- |
| `@modelcontextprotocol/sdk` | high | `node_modules/@modelcontextprotocol/sdk`: 1.30.0 → 1.32.2 | transitive generator/tool dependency; see resolved paths |
| `body-parser` | high | `node_modules/body-parser`: 2.3.0 → 2.4.0 | transitive generator/tool dependency; see resolved paths |
| `brace-expansion` | high | `node_modules/@ts-morph/common/node_modules/brace-expansion`: 5.0.9 → 5.0.12<br>`node_modules/@typescript-eslint/typescript-estree/node_modules/brace-expansion`: 5.0.9 → 5.0.12<br>`node_modules/brace-expansion`: 1.1.18 → 1.1.21 | transitive build/lint tool |
| `fast-uri` | moderate | `node_modules/fast-uri`: 3.1.7 → 3.1.9 | transitive generator/tool dependency; see resolved paths |
| `hono` | moderate | `node_modules/hono`: 4.13.7 → 4.13.14 | transitive generator/tool dependency; see resolved paths |
| `ip-address` | moderate | `node_modules/ip-address`: 10.4.0 → 10.7.5 | transitive generator/tool dependency; see resolved paths |
| `next` | critical | `node_modules/next`: 16.3.5 → 16.4.3 | direct production framework |
| `proxy-addr` | critical | `node_modules/proxy-addr`: 2.0.7 → 2.0.8 | transitive generator/tool dependency; see resolved paths |
| `shadcn` | high | `node_modules/shadcn`: 4.1.0 → 4.22.1 | direct generator CLI: production-declared → development |
| `source-map-js` | high | `node_modules/source-map-js`: 1.2.1 → 1.2.2 | transitive build/lint tool |
| `zod` | high | `node_modules/shadcn/node_modules/zod`: 3.25.76 → removed/deduplicated<br>`node_modules/zod`: 4.3.6 → 4.6.7 | transitive generator/tool dependency; see resolved paths |

## Commands / evidence

- `npm audit --json`: original nonzero result saved as `audit-before.json`.
- `npm explain next shadcn proxy-addr`: original paths saved as `dependency-paths-before.txt`.
- `npm install next@16.4.3 eslint-config-next@16.4.3`, `npm install --save-dev shadcn@4.22.1`, then `npm audit fix` without force.
- `npm audit --json`, `npm audit --omit=dev --json`: zero final findings, saved separately.
- `npm ls next eslint-config-next shadcn @modelcontextprotocol/sdk express proxy-addr brace-expansion source-map-js zod`: final versions/paths saved as `dependency-paths-after.txt`.

There is **no unresolved critical audit record in this resolved graph** as of this run. Future advisory changes still require re-auditing CI/deployments. Source lint retains two pre-existing warnings; the new upstream transition-provider error is repaired rather than suppressed. No framework configuration is loosened to obtain the audit result.
