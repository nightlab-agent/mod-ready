# The Claude Code mod API, indexed

The whole Claude Code mod API on one page per Claude Code version, and a diff
between versions. The engine writes the API's TypeScript declarations beside
every mod it loads, a 22,566-line file that lives only on your disk and is
marked early access. This folder indexes that file per version: every event
with its input, result and chunk types, every `$` noun and member signature,
every UI element with the surfaces that draw it and its props, every export.
One script makes the index; `diff` says what a version added and dropped.

This folder was the separate repo `claude-code-mod-api` until mod-ready 0.2.0.

## The index

- [`index/2.1.310/README.md`](./index/2.1.310/README.md): Claude Code 2.1.310. 111 events, 21 `$` nouns with 85 members, 12 UI elements, 482 exports.

Each version is a folder, `index/<version>/`, with the page and a
`summary.json` the diff reads. A new version lands as a commit and a
CHANGELOG line when the Claude Code that runs Nightlab's own mods updates;
watch or star the repo to see it. If your Claude Code is newer than the newest
folder here, make the page yourself in the next section, and open a pull request
with it if you like.

## Make the index for your own version

1. Load any mod once. The engine writes the declarations beside it at
   `<your-mod>/.claude-plugin/types/claude-code/index.d.ts`; its first line
   names the Claude Code version that wrote it.
2. From a clone of mod-ready, index that file:

   ```
   git clone https://github.com/nightlab-agent/mod-ready
   cd mod-ready
   node api/bin/mod-api-index.mjs index <your-mod>/.claude-plugin/types/claude-code/index.d.ts api/index
   ```

   It writes `api/index/<version>/README.md` and `api/index/<version>/summary.json`
   and prints the counts. Node 18 or newer, no dependencies, no network.
3. See what changed since a version you have indexed:

   ```
   node api/bin/mod-api-index.mjs diff api/index/2.1.310/summary.json api/index/<version>/summary.json
   ```

   It prints added and dropped events, nouns, member signatures, elements,
   their props and surfaces, builtin tool names and exports, and exits 1 when there is a difference,
   0 when there is none.

## What it reads and what it leaves out

- It reads names and signatures: the event rows of the engine's type maps,
  the members of `CoreEngineInterface` and `EngineInterface`, the `ElementConstructor`
  members by surface with the props of their `<Name>Props` type,
  `BuiltinToolInputs`, and every top-level export. The declaration
  file's own comments are not copied, and the file itself is not in this repo;
  it is Anthropic's, and the engine writes it for you.
- The parse is line-based, not a TypeScript compiler. A method signature is
  joined across up to 40 lines and cut at 300 characters; the fixture tests pin
  the shapes it handles. A shape the file has not used yet may be missed; an
  issue with the line is enough to add it.
- `BuiltinToolInputs` is empty in 2.1.310 (a mod augments it with the tools it
  types), so the page says so instead of listing tools.
- It judges nothing: no "breaking" labels, no advice. Read the diff and decide.

Exit codes: 0 ran (or no difference); 1 a difference was found; 2 an input
missing or unreadable, named; 64 bad arguments, with the usage.

## Measured

Counts on Nightlab's own copy of the 2.1.310 declaration file, 2026-10-29:

| What | Count | Command |
|---|---|---|
| lines in the 2.1.310 declaration file | 22,566 | `node api/bin/mod-api-index.mjs index <file> api/index` prints it |
| distinct event names | 111 | same, `events` |
| event rows across the five type maps | 224 | `grep -cE "^      '[a-z]+\.[a-zA-Z]+': " <file>` |
| tests | 12 | `node --test api/tests/index.test.mjs` |

Re-running `index` on that file from this folder writes a page and a
`summary.json` byte for byte the same as the committed ones.

The mods this index was built beside: [subagent-spend](https://github.com/nightlab-agent/subagent-spend),
[usage-file](https://github.com/nightlab-agent/usage-file),
[turn-tally](https://github.com/nightlab-agent/turn-tally),
[file-trail](https://github.com/nightlab-agent/file-trail).

## Tests

12 tests in `api/tests/index.test.mjs`, on two fixture declaration files, one
inline snippet and the committed index. `sh api/tests/release.sh` runs them, type-checks the
script, limits each file to 400 lines, and plants a parser bug (interfaces
skipped) that the tests must catch; mod-ready's `sh tests/release.sh` runs it.
Nothing here runs inside Claude Code and nothing leaves your machine.
