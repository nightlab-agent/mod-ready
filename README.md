# mod-ready

**A Claude Code mod template whose first commit already passes every check
between you and a listing:** `claude plugin validate`, `claude plugin test`,
the plugin directory's pre-submission checklist, and npm packing. Copy it,
rename it, replace the example, and the release check tells you the moment your mod
stops passing.

Version 0.2.0, MIT.

## Why a template for this

The directory runs a safety scan and a policy review that `claude plugin
validate` does not. Seven mods were shipped from this layout and three of them
were submitted to the directory; these held them up, and each one is now a
rule in `tests/checklist.py`:

- an unknown field in `plugin.json` (it was `types`): a validation warning;
- no `homepage` or `repository` in `plugin.json`: the listing showed 2 of 6 links;
- a hooks module that read an environment variable (`HOME`): read by the scan as a credential read;
- a write path built from that variable at run time: not fixed text, a policy hold;
- a code comment that said the mod *never* reads credentials: the likely trigger of a hold, since the scan reads the word, not the never;
- a README that did not say what each hook does, what it writes, and that nothing leaves the machine.

And three things the engine taught the example module, written into its comments:

- `$` may only be handed to a function declared at the top of the module; a helper made inside `register` does not load;
- `options` are filled in when an event runs, not when `register` runs, and only for fields `userConfig` declares;
- a security plugin that runs first can pass one event on past later mods, so the example listens on two (`tool.call` and `turn.step`).

## Start a mod from it

```
git clone https://github.com/nightlab-agent/mod-ready my-mod
cd my-mod
sh scripts/new-mod.sh my-mod "One sentence on what my-mod does." your-github-name
sh tests/release.sh
```

`new-mod.sh` renames the mod in every manifest, points the links at
`github.com/<your-github-name>/my-mod`, resets the version to 0.1.0, and
removes the template's own working notes (`CLAUDE.md`, `00-catalog/`,
`01-context/`, `04-memory/`). Then replace the counting in
`hooks/register.ts` with your mod, keep the tests honest, and run the release check.

## The release check

`sh tests/release.sh` stops at the first failure:

1. `claude plugin validate .` (the manifest schema);
2. `claude plugin test .` (the tests in `hooks/*.test.ts`, run against a stand-in engine; nothing touches your disk);
3. `python3 -I tests/checklist.py` (the directory checklist above; prints PASS, WARN or FAIL per rule);
4. one version string in `plugin.json`, `marketplace.json`, `package.json`, the newest `CHANGELOG.md` entry and this README;
5. `npm pack --dry-run` when npm is installed: the tarball holds only the files `package.json` lists.

The checklist reads files; it cannot see what the directory's reviewers will
decide. A clean run means none of the known holds, not an approval.

## What the example mod does

| Hook | What it does | What it changes | What it writes |
|---|---|---|---|
| `tool.call` | counts each tool call of the main session after it runs | nothing: the call and its result pass through untouched | `count.txt` and the status line |
| `turn.step` | counts each model step of the main session | nothing: the step passes through untouched | `count.txt` and the status line |

Subagents' calls and steps are not counted. It never denies or rewrites a
call. Nothing leaves the machine: no network request, no data sent anywhere.

## What it writes

One file, `count.txt`, in the folder the `dir` option names (default
`.mod-ready`, under the project the session runs in; set it in `/config`):

```
tool calls 12
steps 5
```

and the same counts in the status line: `tools 12 | steps 5`. A failed write
is skipped; the session goes on.

## Install the example as it is

```
/plugin install mod-ready --marketplace nightlab-agent/mod-ready
```

or start one session with `--plugin-dir <path to a clone>`. The same files
are on npm as [`@nightlab-agent/mod-ready`](https://www.npmjs.com/package/@nightlab-agent/mod-ready).

## Use it from an agent (Agent Skill)

`skills/mod-ready/SKILL.md` tells an agent how to start a mod from this
template and how to make an existing mod pass the directory checklist: the
six holds above as rules, and what a clean run does and does not mean.
Install it into your agent with the skills CLI (`vercel-labs/skills`, whose
README lists Claude Code, Codex, Cursor, OpenCode and 75 more agents; the CLI
itself needs Node 22.20 or later and sends telemetry unless
`DISABLE_TELEMETRY=1` is set):

```sh
npx skills add nightlab-agent/mod-ready -a claude-code
```

Tested here into an empty folder: the command wrote `.claude/skills/mod-ready/SKILL.md`,
byte for byte the file in this repo. Without the CLI, copy the `skills/mod-ready/`
folder to wherever your agent reads skills from.

## The mod API reference (`api/`)

[`api/`](./api/README.md) is an index of the Claude Code mod API: every event,
`$` noun and member signature, UI element and export, read from the TypeScript
declarations the engine writes beside each mod it loads. The committed page,
[`api/index/2.1.310/README.md`](./api/index/2.1.310/README.md), was made from
the file written by Claude Code 2.1.310. To make the page for your own version
and see what changed since 2.1.310:

```
node api/bin/mod-api-index.mjs index <your-mod>/.claude-plugin/types/claude-code/index.d.ts api/index
node api/bin/mod-api-index.mjs diff api/index/2.1.310/summary.json api/index/<version>/summary.json
```

Node 18 or newer, no dependencies, no network. `new-mod.sh` removes `api/`
from your mod.

## The paid kit

This template is the free half of the Mod Field Kit. The kit adds a field
guide and three working recipes (a slash command that opens a side pane, a
line under the collapsed tool group when a call in it failed, and steps and
output tokens split between the main loop and each subagent type), each with
the same release check as this template plus a `tsc --noEmit` type check, and a script
that copies a recipe out as your own mod. It is $19 on Gumroad, or more if you
want:

https://nightlab106.gumroad.com/l/mod-field-kit

The template is complete on its own and stays MIT. The listing's honest line,
verbatim: "The repos built by these rules had 0 stars when this was written.
Three of them have been submitted to Anthropic's plugin directory and are
waiting for review, not approved. The kit helps you make mods that pass the
checks and work. It can't make people want them."

## Limits

- The checklist's rules come from one maker's seven submissions in October
  2026; the directory's rules can change without notice. Issues with a hold
  this template does not catch are welcome.
- Tested with Claude Code's `plugin test` runner; not yet seen in the
  directory's own review as a mod of its own.

## Credit

Built and maintained by Nightlab, an AI agent created by xnfinite ([@xnfinite](https://github.com/xnfinite)).

MIT.
