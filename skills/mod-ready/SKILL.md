---
name: mod-ready
description: Build or fix a Claude Code mod (a hooks module plugin) so it passes plugin validate, plugin test, a checklist built from what the plugin directory flagged, and npm packing. Use when the user wants to start a Claude Code mod, check an existing one against problems the plugin directory flagged before, or asks why a plugin directory submission was held.
---

# mod-ready

Start every Claude Code mod from a layout that already passes, and run the same release check on every change.

## Start a new mod

1. `git clone https://github.com/nightlab-agent/mod-ready <name>` then `cd <name>`.
2. `sh scripts/new-mod.sh <name> "One sentence on what it does." <github-user>`: renames every manifest, points the links at `github.com/<github-user>/<name>`, resets the version to 0.1.0, replaces CHANGELOG.md and README.md with starters, removes the template's own notes and this skill, and deletes itself.
3. Replace the counting in `hooks/register.ts` with the mod. Keep the tests in `hooks/*.test.ts` honest: each must fail when the behaviour it names is removed.
4. `sh tests/release.sh`. It ends at the first failure. It needs TypeScript (`npm install --save-dev typescript`, or set `TSC`) and the engine's declarations (written beside the mod as `.claude-plugin/types/claude-code/index.d.ts` when Claude Code loads it, or set `CC_TYPES`); a missing one fails with the install command. Fix and run again until its last line starts `release check passed:` and names every step that ran, and quote that line to the user.

## Check an existing mod against the checklist

Copy `tests/checklist.py` into the mod and run `python3 -I tests/checklist.py` from its root. Each rule is a problem the directory flagged on a real submission. Fix every FAIL; say which WARNs you leave and why. The six flagged on real submissions:

- an unknown field in `.claude-plugin/plugin.json` (it was `types`);
- no `homepage` or `repository` in `plugin.json`;
- a hooks module that reads an environment variable such as `HOME` (why it was held is a guess): take the folder from a `userConfig` option with a fixed default instead;
- a write path built at run time from such a variable: write under the option's folder;
- a code comment saying the mod *never* reads credentials (that the word caused the hold is a guess): drop the word;
- a README that does not say, per hook, what it does, what it changes and what it writes, and that nothing leaves the machine.

## Engine behaviour the example follows (observed while building, not tested)

- `$` may only be handed to a function declared at the top of the module; a helper made inside `register` does not load.
- `options` are filled when an event runs, not when `register` runs, and only for fields `userConfig` declares.
- Another plugin that runs first can pass one event on past later mods, so listen on two events (`tool.call` and `turn.step`) when one missed event would lose data.

## What a clean run means

The checklist reads files. A clean run means none of the known problems, not an approval: the directory decides, and its rules can change without notice. Never say a mod is "approved" or "accepted" because the release check passed.
