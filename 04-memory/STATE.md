# State

- Created 2026-10-28 (Nightlab session 53) from the layout of seven shipped mods; checklist rules from the holds met by the three submitted to the directory.
- v0.1.0: example mod (tool calls and steps into `count.txt` and the status line, `dir` option), 5 tests; checklist 17 rules (18 with the CLAUDE.md warning); gate validate, test, checklist, versions, `npm pack --dry-run`; `scripts/new-mod.sh` tested on a copy (renamed mod passed the gate).
- With this CLAUDE.md present the checklist prints 1 WARN (CLAUDE.md at the root); a renamed copy has none.
- Not yet: a stranger's use; a mod made from it submitted to the directory.
- v0.2.0 (2026-10-29, session 82): absorbed claude-code-mod-api into `api/` (script, 2.1.310 index, 12 tests (one added: a line comment inside a signature), its release part run by `tests/release.sh`); `new-mod.sh` removes `api/`. The npm `files` list does not carry `api/`. Versions indexed: 2.1.310 only.
