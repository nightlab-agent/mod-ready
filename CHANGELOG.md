# Changelog

The form is Keep a Changelog; versions follow SemVer.

## [Unreleased]

## 0.2.0 - 2026-10-29 - absorbs claude-code-mod-api; collision tests; the release check runs anywhere

### Added
- `api/`: the Claude Code mod API index, moved here from the `claude-code-mod-api` repo (its 0.1.0 entry there is the earlier history). `api/bin/mod-api-index.mjs` reads the declaration file the engine writes beside a mod and writes `api/index/<version>/README.md` and `summary.json`; `diff` prints what one version adds and drops against another. The committed index is for Claude Code 2.1.310 (111 events, 21 `$` nouns, 85 members, 12 UI elements, 482 exports); re-running it on that file writes the same bytes.
- `api/tests/release.sh`: the folder's 12 tests (the 11 it came with and one new: a line comment inside a multi-line signature is not copied into it; no test failed when line comments were kept before), a type check of the script, file sizes, and a planted parser bug the tests must catch, now run against a copy that first passes unchanged. `tests/release.sh` runs it.
- README: a short section on the API reference.
- The example mod writes a `.gitignore` holding `*` into its folder on its first write (unless one is there), so the session counts stay out of git. Tests: written once; an existing one left alone.
- Collision tests for the example mod: out of order (a slow write from an earlier call must not land after a newer count), two at once (a subagent's call and step during a main step leave only the main step counted), look-alikes (`Read`, `mcp__docs__Read` and `ReadMcpResourceTool` count as three calls).
- `mod-api-index index` refuses a file that is not a Claude Code declaration file (no `// Written by Claude Code <version>.` first line, or no `declare module 'claude-code'`): exit 2 with a message, nothing written. Before, it wrote an index named `unknown`. A test covers three such files.
- README: a "Remove it" section, the release check's prerequisites with install commands, and all seven steps it runs.

### Changed
- `scripts/new-mod.sh` removes `api/` from a new mod, as it removes the template's skill.
- The API index's version test reads mod-ready's own package.json, CHANGELOG and README.
- README credit line reads "created by xnfinite".
- Fixed: the example mod's saves run one after another and only the newest waiting save writes. Before, a slow write from an earlier call could land after a newer one and leave an older count in `count.txt` (the out-of-order test failed on the old code).
- `tests/typecheck.sh` and `api/tests/release.sh` no longer fall back to a folder on the maintainer's machine. They use `TSC`, `CC_TYPES` and `TYPES` when set, else the project's own `npx --no-install tsc`, the declarations Claude Code writes beside the mod, and `node_modules/@types`; a missing one still fails, now with what to install.
- `tests/release.sh` ends with a line naming every step that ran (`release check passed: ...`), so a skipped `api/` or npm step shows.
- README: a shorter headline; the list of what held up earlier submissions moved out, and the causes the checklist only guesses at are marked as guesses in its comments. The status line example says it has not yet been seen on a real screen.
- Notes in `CLAUDE.md`, `00-catalog/`, `01-context/` and `04-memory/` rewritten in plain words.

This is a minor version, not a patch: a new folder with its own script and tests, and the example mod writes a second file. The checklist's rules do not change.

## 0.1.3 - 2026-10-28 - names the paid kit

### Changed
- README: a section on the Mod Field Kit, the paid half this template is the free half of: what it adds, the price, the link and the listing's honest line. No code change.

## 0.1.2 - 2026-10-28 - the release check fails closed; an Agent Skill

### Added
- `skills/mod-ready/SKILL.md`: an Agent Skill that walks an agent through starting a mod from this template, or making an existing mod pass the directory checklist. Installable with the skills CLI (`npx skills add nightlab-agent/mod-ready -a claude-code`) or by copying the folder; packed into the npm tarball.

### Changed
- package.json drops `publishConfig`. The checklist now refuses one, because it can send the package to a different registry or with different access than the reader of package.json expects; this package is already public on npm, so nothing changes for installs.
- The checklist fails (was: warns) on a `publishConfig` in package.json, and fails on a package.json repository that is not the plugin's own GitHub repo.
- `scripts/new-mod.sh` drops `scripts/new-mod.sh` (which it deletes) and `skills/` (the template's own skill, which it removes) from the new mod's package.json `files`; before, the generated mod failed the checklist's "every package.json files entry exists" rule on its first release-check run.
- `tests/typecheck.sh` fails when `TSC` is neither an executable nor a command on PATH (before, it fell back to PATH), or when there is no hooks module file to check (before, it passed).

## 0.1.1 - 2026-10-28 - the release check type-checks

### Changed
- The release check type-checks the hooks module, its tests and the state contract with `tsc --noEmit` against the
  engine's own declarations (`tests/typecheck.sh`, the compiler options the declarations' header gives a hooks module).
  No `tsc` or no declarations fails the release check; it never skips.

### Fixed
- The npm package carries `tests/typecheck.sh` beside `tests/checklist.py`.
- The default-folder test called Read with `path`; Read takes `file_path`. Template users copying that test got the wrong shape.

## 0.1.0 - 2026-10-28 - first release

### Added
- Example mod: tool calls and model steps of the main session counted into `count.txt` and the status line, folder from the `dir` option.
- `tests/checklist.py`: the plugin directory's pre-submission checklist as file checks, one rule per problem the directory flagged on three submitted mods (corrected in 0.2.0; this line said seven).
- `tests/release.sh`: validate, test, checklist, one version string, `npm pack --dry-run`.
- `scripts/new-mod.sh`: rename the template into your own mod.
