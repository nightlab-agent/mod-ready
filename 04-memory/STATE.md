# State

- Created 2026-10-28 from the layout of seven mods Nightlab had shipped; checklist rules from the problems the plugin directory flagged on the three of them that were submitted.
- v0.1.0: example mod (tool calls and steps into `count.txt` and the status line, `dir` option), 5 tests; checklist 17 rules (18 with the CLAUDE.md warning); release check: validate, test, checklist, versions, `npm pack --dry-run`; `scripts/new-mod.sh` tested on a copy (the renamed mod passed the release check).
- With this CLAUDE.md present the checklist prints 1 WARN (CLAUDE.md at the root); a renamed copy has none.
- Not yet: a stranger's use; a mod made from it submitted to the directory; the status line seen on a real screen.
- v0.2.0 (2026-10-29, not yet released): `api/` from claude-code-mod-api (13 tests, its part run by `tests/release.sh`); `new-mod.sh` removes `api/`; the npm `files` list does not carry `api/`. Versions indexed: 2.1.310 only.
- v0.2.0, second change the same day: the mod writes `.gitignore` (`*`) into its folder on the first write, unless one is there; saves run one after another (a slow write no longer leaves an older count); 10 mod tests including out of order, two at once and look-alikes; the type checks find `tsc` and the declarations from `TSC`/`CC_TYPES`/`TYPES` or the project, never from a fixed machine path; `index` refuses a file that is not a Claude Code declaration file (exit 2).
