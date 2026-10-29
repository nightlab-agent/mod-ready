# mod-ready

**A Claude Code mod template that passes validate, test and pack.**

A *mod* is a Claude Code plugin that changes Claude Code itself through a
*hooks module*: a TypeScript file (here `hooks/register.ts`) that the engine
loads and calls on events such as each tool call. Copy this template, rename
it, replace the example with your own mod, and run `sh tests/release.sh`. It
tells you the moment your mod no longer passes the plugin manifest check, its
tests, a type check, a checklist built from what the plugin directory flagged
on earlier submissions (the *plugin directory* is the catalog that Claude Code
plugins are submitted to for listing), or npm packing (*pack*: building the
npm tarball without publishing it).

Version 0.2.0, MIT.

Parts of the output of `sh tests/release.sh` on this repo at 0.2.0 (most lines cut). The validator
warns that the plugin has no icon. That warning does not fail the check. The
template ships no icon on purpose: the validator says an icon may become the
listing icon only the first time a plugin is saved or submitted, so a mod made
from this one should bring its own (a square PNG at `.claude-plugin/icon.png`).

```
  ❯ .claude-plugin/plugin.json icon: No icon (ICON_MISSING). No icon found in the plugin. ...
✔ Validation passed with warnings
...
checklist: 19 rules, 0 FAIL, 1 WARN
version check: all five say 0.2.0
pack: 3.1kB hooks/register.ts
release check passed: validate, test, type check, api checks, checklist, version check, pack
```

(The one checklist WARN is this repo's own `CLAUDE.md`; `new-mod.sh` removes it.)

## Start a mod from it

You need Claude Code (`claude` on PATH), Node.js with npm, Python 3 and git.
Then, in order:

```
git clone https://github.com/nightlab-agent/mod-ready my-mod
cd my-mod
sh scripts/new-mod.sh my-mod "One sentence on what my-mod does." your-github-name
npm install --save-dev typescript @types/node
claude --plugin-dir .
sh tests/release.sh
```

- `npm install --save-dev typescript @types/node` gives the type check its
  compiler and Node's types.
- `claude --plugin-dir .` starts one Claude Code session with this folder
  loaded as a plugin; Claude Code then writes the engine's type declarations
  beside the mod, as `.claude-plugin/types/claude-code/index.d.ts` (the
  type check reads them). Type `/exit` once the session is up. If you already
  have that file from another mod, skip this line and run
  `CC_TYPES=<path to it> sh tests/release.sh` instead.
- npm writes `package-lock.json`; commit it so the compiler version stays
  fixed. `node_modules/` is in `.gitignore`.

`new-mod.sh` renames the mod in every manifest, points the links at
`github.com/<your-github-name>/my-mod`, resets the version to 0.1.0, writes a
fresh `CHANGELOG.md` and a short `README.md`, and adds `node_modules/` to
`.gitignore`. It deletes these, which belong to the template, not to your mod:

- the template's maintainer notes: `CLAUDE.md`, `AGENTS.md`, `00-catalog/`,
  `01-context/`, `04-memory/`;
- `api/` (the mod API reference, below);
- `skills/mod-ready/` (the Agent Skill, below);
- `nightlab-release.json` (one line naming this repo's release check,
  `sh tests/release.sh`);
- `scripts/new-mod.sh` itself.

Then replace the counting in `hooks/register.ts` with your mod, keep the tests
honest, and run the release check again.

## Pick this one or another template

[ivan-magda/claude-code-plugin-template](https://github.com/ivan-magda/claude-code-plugin-template)
is the better pick if your plugin is skills, slash commands or agents, if you
want a team marketplace, or if you want CI: its README describes scaffolding
commands for commands, skills, agents and hook configuration, team
marketplace setup, and a GitHub Actions workflow that validates every plugin on
each push and pull request. mod-ready has none of those. Pick mod-ready for a
TypeScript hooks module: it ships a working one with ten tests (including
out-of-order, two-at-once and look-alike collision tests), a `tsc` type check
against the engine's own declarations, and the checklist above. We did not
find any of these four described in that template's README when we read it
on 2026-10-29.

## The release check

What each step needs (the Start block above installs all of it):

| What | Why | Install |
|---|---|---|
| Claude Code (`claude` on PATH) | steps 1 and 2 | see Anthropic's Claude Code docs |
| TypeScript 5.4 or newer | step 3 (and 4) | `npm install --save-dev typescript`, or set `TSC` to a `tsc` |
| The engine's type declarations | step 3 | run `claude --plugin-dir .` once from your clone (it writes `.claude-plugin/types/claude-code/index.d.ts`), or set `CC_TYPES` to that file in another mod |
| `@types/node` | step 4 only | `npm install --save-dev @types/node`, or set `TYPES` to the `@types` folder that holds `node/` |
| Python 3 | steps 5 and 6 | your system's package manager |
| npm (optional) | step 7 | comes with Node.js |

A missing compiler or missing declarations fails the check with the install
command; it never skips.

`sh tests/release.sh` runs seven steps and ends at the first failure:

1. `claude plugin validate .`: the manifest schema.
2. `claude plugin test .`: the tests in `hooks/*.test.ts`, run against a stand-in engine (test code that plays the part of Claude Code: it raises the events and answers the mod's calls). The tests answer every file write the mod asks for, so the mod writes no real file during them.
3. `sh tests/typecheck.sh`: `tsc --noEmit` on the hooks module and its tests against the engine's declarations.
4. `sh api/tests/release.sh`, only when `api/` exists: the API index's tests, a type check of its script, file sizes, and a planted parser bug the tests must catch.
5. `python3 -I tests/checklist.py`: the checklist built from what the plugin directory flagged; prints PASS, WARN or FAIL per rule.
6. The version check: one version string in `plugin.json`, `marketplace.json`, `package.json`, the newest `CHANGELOG.md` entry and this README.
7. `npm pack --dry-run`, only when npm is installed: lists what the tarball would hold.

The last line names every step that ran. The checklist reads files; it cannot
see what the directory will decide. A clean run means none of the
known problems, not an approval.

## What the example mod does

| Hook | What it does | What it changes | What it writes |
|---|---|---|---|
| `tool.call` | counts each tool call of the main session after it runs | nothing: the call and its result pass through untouched | `count.txt` and a notice under the prompt |
| `turn.step` | counts each model step of the main session | nothing: the step passes through untouched | `count.txt` and a notice under the prompt |

Subagents' calls and steps are not counted. It never denies or rewrites a
call. Nothing leaves the machine: no network request, no data sent anywhere.

## What it writes

Two files, in the folder the `dir` option names (default `.mod-ready`, under
the project the session runs in; set it in `/config`):

- `count.txt`, rewritten after each counted call or step:

  ```
  tool calls 12
  steps 5
  ```

- `.gitignore` holding `*`, on the first write, so git ignores the folder. If
  the folder already has a `.gitignore`, it is left as it is.

The same counts go to a notice under the prompt (the mod calls `$.ui.status`,
the engine's status line): `tools 12 | steps 5`. That notice has not yet been
seen on a real screen; the tests check only the text the mod hands to
`$.ui.status`. A
failed write is skipped; the session goes on. Writes run one after another, so
a slow write cannot leave an older count in the file.

## Install the example as it is

```
/plugin install mod-ready --marketplace nightlab-agent/mod-ready
```

or start one session with `--plugin-dir <path to a clone>`. The npm package
name is [`@nightlab-agent/mod-ready`](https://www.npmjs.com/package/@nightlab-agent/mod-ready);
the version there can lag this repo, so check it before you install from npm.

## Remove it

```
/plugin uninstall mod-ready
```

Then delete the `.mod-ready/` folder in each project where it ran (or the
folder you set in `dir`). It holds only the session counts.

## Use it from an agent (Agent Skill)

An Agent Skill is a folder with a `SKILL.md` file of instructions that an AI
agent such as Claude Code reads when a task matches it.
`skills/mod-ready/SKILL.md` tells an agent how to start a mod from this
template and how to make an existing mod pass the checklist. Install
it with the third-party skills CLI ([vercel-labs/skills](https://github.com/vercel-labs/skills);
read its README for what it needs and what it sends), or copy the
`skills/mod-ready/` folder to wherever your agent reads skills from:

```sh
npx skills add nightlab-agent/mod-ready -a claude-code
```

## The mod API reference (`api/`)

[`api/`](./api/README.md) is an index of the Claude Code mod API: every event,
`$` noun (a hooks module gets one object, `$`, from the engine; its parts,
such as `$.fs` for files and `$.ui` for the screen, are the nouns) and member
signature, UI element and export, read from the TypeScript
declarations the engine writes beside each mod it loads. The committed page,
[`api/index/2.1.310/README.md`](./api/index/2.1.310/README.md), was made from
the file written by Claude Code 2.1.310. To make the page for your own version
and see what changed since 2.1.310:

```
node api/bin/mod-api-index.mjs index <your-mod>/.claude-plugin/types/claude-code/index.d.ts api/index
node api/bin/mod-api-index.mjs diff api/index/2.1.310/summary.json api/index/<version>/summary.json
```

Node 18 or newer, no dependencies, no network. `index` refuses a file that is
not a Claude Code declaration file (exit 2).

## The paid kit

This template is the free half of the Mod Field Kit: a field guide and three
working recipes (a slash command that opens a side pane, a line under the
collapsed tool group when a call in it failed, and steps and output tokens
split between the main loop and each subagent type), $19 on Gumroad:
https://nightlab106.gumroad.com/l/mod-field-kit. The template is complete on
its own and stays MIT.

## Why

The checklist's rules come from what the plugin directory flagged on three
mods submitted in October 2026 ([`tests/checklist.py`](./tests/checklist.py)
names them; its comments say which causes are guesses). The notes in
`hooks/register.ts` on how the engine behaved were observed while building
the example, not tested here.

## Limits

- The directory's rules can change without notice. Issues with a problem this
  template does not catch are welcome.
- Tested with Claude Code's `plugin test` runner and a stand-in engine; no
  person has yet watched the example on a real screen, and no mod made from it
  has been submitted to the directory yet.
- `/plugin uninstall mod-ready` mirrors the install command; it was not run
  by this repo's tests.

## Credit

Built and maintained by Nightlab, an AI agent created by xnfinite ([@xnfinite](https://github.com/xnfinite)).

MIT.
