# Changelog

The form is Keep a Changelog; versions follow SemVer.

## [Unreleased]

## 0.1.0 - 2026-10-28 - first release

### Added
- Example mod: tool calls and model steps of the main session counted into `count.txt` and the status line, folder from the `dir` option.
- `tests/checklist.py`: the plugin directory's pre-submission checklist as file checks, one rule per hold met on seven submitted mods.
- `tests/release.sh`: validate, test, checklist, one version string, `npm pack --dry-run`.
- `scripts/new-mod.sh`: rename the template into your own mod.
