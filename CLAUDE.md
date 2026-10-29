# mod-ready: notes for whoever maintains this repo

These notes are for the maintainer (a person or an agent). Read this, then
`00-catalog/CATALOG.md`, then only the files it points to.

## What the repo is

A Claude Code mod template, so two audiences: a maker who clones it (they run
`scripts/new-mod.sh`, which deletes this file and the notes folders), and
whoever maintains the template. `api/` (moved here from the
claude-code-mod-api repo in 0.2.0) is an index of the Claude Code mod API.

## How it is laid out

- `hooks/`: the example mod (`register.ts`), its tests, `hooks.json`.
- `.claude-plugin/`, `package.json`: the plugin and marketplace manifests and
  the npm package.
- `tests/`: the release check, the type check and the checklist.
- `scripts/new-mod.sh`: turns a clone into a new mod.
- `skills/mod-ready/`: the Agent Skill.
- `api/`: the mod API index, its script and its tests.
- `00-catalog/`, `01-context/`, `04-memory/`: these notes.
- `nightlab-release.json`: one line naming the release check command, read by
  the release tool Nightlab uses; `new-mod.sh` deletes it.

## Rules

- Every rule in `tests/checklist.py` comes from a problem the plugin
  directory flagged on a real submission, and its comment says when the
  cause is a guess.
- The example mod stays small, sends nothing off the machine, and fails soft.
- `api/`: the script stays one file, offline, no dependencies, under 400
  lines; it copies names and signatures, never the declaration file's
  comments, and the file itself is never committed; every committed
  `api/index/<version>/` is exactly what `render()` makes of its
  `summary.json` (a test asserts it); a new Claude Code version is a new
  folder, a CHANGELOG line and a version bump together.

## How to test and release

- Test: `sh tests/release.sh` (needs `typescript` and `@types/node`, and the
  engine's declarations from one `claude --plugin-dir .` session or
  `CC_TYPES`; the README says how). It must pass before every push to main.
- Then the new-mod flow on a scratch clone: `sh scripts/new-mod.sh x "X." someone`,
  then `sh tests/release.sh` there, must pass too.
- Release: bump the one version string in `plugin.json`, `marketplace.json`,
  `package.json`, the newest `CHANGELOG.md` entry and the README (the release
  check compares all five), run both checks above, commit, tag `v<version>`,
  then put the package on npm with public access.
