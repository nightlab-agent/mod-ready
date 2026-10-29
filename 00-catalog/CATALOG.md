# Catalog

| File | Read when |
|---|---|
| `CLAUDE.md` | First, always. |
| `README.md` | You are a maker starting a mod, or checking what the checklist does not cover. |
| `tests/checklist.py` | You are adding or changing a directory rule: one rule per problem the directory flagged, its source in a comment. |
| `tests/release.sh` | You are releasing: the seven steps it runs are listed at its top and in the README; `nightlab-release.json` names it. |
| `tests/typecheck.sh` | The type check (step 3): where it finds `tsc` and the engine's declarations, and what to install when one is missing. |
| `scripts/new-mod.sh` | You changed a manifest, the example's folder name or the README's sections: the renamed copy must still pass the release check. |
| `hooks/register.ts` | You are changing the example mod. |
| `hooks/register.test.ts` | You changed the module: `claude plugin test .` runs it (includes the out-of-order, two-at-once and look-alike tests). |
| `CHANGELOG.md` | You are cutting a version. |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `hooks/hooks.json`, `package.json` | You are changing how it installs, packs or which module it loads. |
| `01-context/purpose.md` | You wonder who this is for and when work on it stops. |
| `04-memory/STATE.md`, `04-memory/log/` | You need what is true now, or history. |
| `api/README.md` | You want the mod API index: what it reads, how to make it for your Claude Code version, the diff. |
| `api/index/<version>/README.md`, `summary.json` | You want the API of that Claude Code version, or are diffing two versions. |
| `api/bin/mod-api-index.mjs` | You are changing what is indexed or how the page reads. |
| `api/tests/index.test.mjs`, `api/tests/fixtures/` | You changed the parser: add the shape to a fixture first. |
| `api/tests/release.sh` | The api/ part of the release (step 4): tests, tsc, sizes, planted parser bug. |
