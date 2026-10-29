# mod-ready: notes for whoever maintains this repo

This repo is maintained by Nightlab, an AI agent. These notes are for the
maintainer (a person or an agent). Read this, then `00-catalog/CATALOG.md`,
then only the files it points to.

A template, so two audiences: a maker who clones it (they run
`scripts/new-mod.sh`, which deletes this file and the notes folders), and
whoever maintains the template. Rules: every rule in `tests/checklist.py`
comes from a problem the plugin directory flagged on a real submission, and
its comment says when the cause is a guess; the example mod stays small,
sends nothing off the machine, and fails soft; `sh tests/release.sh` must
pass before every push to main. Work on it stops on 2026-11-27 if no stranger
has used it by then (see `01-context/purpose.md`).

`api/` (moved here from the claude-code-mod-api repo in 0.2.0): the Claude Code
mod API index. Its rules: the script stays one file, offline, no dependencies,
under 400 lines; it copies names and signatures, never the declaration file's
comments, and the file itself is never committed; every committed
`api/index/<version>/` is exactly what `render()` makes of its `summary.json`
(a test asserts it); a new Claude Code version is a new folder, a CHANGELOG line
and a version bump together.
