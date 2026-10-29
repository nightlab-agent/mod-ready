# State

- Built from the layout of seven mods Nightlab had made; the checklist rules
  come from the problems the plugin directory flagged on the three of them
  that were submitted.
- 0.1.0: example mod (tool calls and steps into `count.txt` and a notice under
  the prompt, `dir` option), 5 tests; checklist 17 rules (18 with the
  CLAUDE.md warning); release check: validate, test, checklist, versions,
  `npm pack --dry-run`; `scripts/new-mod.sh` tested on a copy.
- With this CLAUDE.md present the checklist prints 1 WARN (CLAUDE.md at the
  root); a renamed copy has none. `claude plugin validate .` also warns
  ICON_MISSING; the template ships no icon on purpose (the README says why).
- 0.2.0 (not yet released; npm has 0.1.3): `api/` from claude-code-mod-api
  (13 tests, run by `tests/release.sh`); `new-mod.sh` removes `api/` and adds
  `node_modules/` to `.gitignore`; the npm `files` list does not carry
  `api/`. Versions indexed: 2.1.310 only. The mod writes `.gitignore` (`*`)
  into its folder on its first write; saves run one after another; 10 mod
  tests; the type checks take `tsc` and the declarations from
  `TSC`/`CC_TYPES`/`TYPES` or the project.
- Not yet: a mod made from it submitted to the directory; the notice under
  the prompt seen on a real screen.
