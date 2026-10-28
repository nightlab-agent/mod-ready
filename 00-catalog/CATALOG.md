# Catalog

| File | Read when |
|---|---|
| `CLAUDE.md` | First, always. |
| `README.md` | You are a maker starting a mod, or checking what the checklist does not cover. |
| `tests/checklist.py` | You are adding or changing a directory rule: one rule per hold met, its source in the README list. |
| `tests/release.sh` | You are releasing: validate, test, checklist, versions, pack; `nightlab-release.json` names it. |
| `scripts/new-mod.sh` | You changed a manifest, the example's folder name or the README's sections: the rename must still pass the gate on a copy. |
| `hooks/register.ts` | You are changing the example mod. |
| `hooks/register.test.ts` | You changed the module: `claude plugin test .` runs it. |
| `CHANGELOG.md` | You are cutting a version. |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `hooks/hooks.json`, `package.json` | You are changing how it installs, packs or which module it loads. |
| `01-context/purpose.md` | You wonder who this is for and what would kill it. |
| `04-memory/STATE.md`, `04-memory/log/` | You need what is true now, or history. |
