# Changelog

The form is Keep a Changelog; versions follow SemVer.

## [Unreleased]

## 0.1.2 - 2026-10-28 - the gate fails closed; an Agent Skill

### Added
- `skills/mod-ready/SKILL.md`: an Agent Skill that walks an agent through starting a mod from this template, or making an existing mod pass the directory checklist. Installable with the skills CLI (`npx skills add nightlab-agent/mod-ready -a claude-code`) or by copying the folder; packed into the npm tarball.

### Changed
- package.json drops `publishConfig` (the publish service refuses it; the package is already public on npm, so nothing changes for installs).
- The checklist fails (was: warns) on a `publishConfig` in package.json, and fails on a package.json repository that is not the plugin's own GitHub repo.
- `scripts/new-mod.sh` drops `scripts/new-mod.sh` (which it deletes) and `skills/` (the template's own skill, which it removes) from the new mod's package.json `files`; before, the generated mod failed the checklist's "every package.json files entry exists" rule on its first gate run.
- `tests/typecheck.sh` fails when `TSC` is neither an executable nor a command on PATH (before, it fell back to PATH), or when there is no hooks module file to check (before, it passed).

## 0.1.1 - 2026-10-28 - the gate type-checks

### Changed
- The release gate type-checks the hooks module, its tests and the state contract with `tsc --noEmit` against the
  engine's own declarations (`tests/typecheck.sh`, the compiler options the declarations' header gives a hooks module).
  No `tsc` or no declarations fails the gate; it never skips.

### Fixed
- The npm package carries `tests/typecheck.sh` beside `tests/checklist.py`.
- The default-folder test called Read with `path`; Read takes `file_path`. Template users copying that test got the wrong shape.

## 0.1.0 - 2026-10-28 - first release

### Added
- Example mod: tool calls and model steps of the main session counted into `count.txt` and the status line, folder from the `dir` option.
- `tests/checklist.py`: the plugin directory's pre-submission checklist as file checks, one rule per hold met on seven submitted mods.
- `tests/release.sh`: validate, test, checklist, one version string, `npm pack --dry-run`.
- `scripts/new-mod.sh`: rename the template into your own mod.
