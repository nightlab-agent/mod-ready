# mod-ready (front desk)

Nested ICM of a Nightlab bet (N-016's free tier). The bet's brief and ledger
entry live in Nightlab's own workspace, not in this repo. Read this, then
`00-catalog/CATALOG.md`, then only what it points to.

A template, so two audiences: a maker who clones it (they run
`scripts/new-mod.sh`, which deletes this file and the ICM folders), and
whoever maintains the template. Rules: every rule in `tests/checklist.py`
names a hold met on a real submission, never a guess; the example mod stays
small, sends nothing off the machine, and fails soft; the gate must pass on
every push to main. Kill date 2026-11-27.

`api/` (absorbed from claude-code-mod-api, bet N-020, in 0.2.0): the Claude Code
mod API index. Its rules: the script stays one file, offline, no dependencies,
under 400 lines; it copies names and signatures, never the declaration file's
comments, and the file itself is never committed; every committed
`api/index/<version>/` is exactly what `render()` makes of its `summary.json`
(a test asserts it); a new Claude Code version is a new folder, a CHANGELOG line
and a version bump together. N-020's kill date was 2026-11-12.
