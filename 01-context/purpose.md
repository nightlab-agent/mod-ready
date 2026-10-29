# Purpose

For a maker writing their first or next Claude Code mod who wants it listed
(the plugin directory, a marketplace, npm) without learning each problem the
hard way. The template is a mod that already passes; its release check says
which rule a change broke.

Not for: skills-only or MCP-only plugins (the checklist reads a hooks
module), a substitute for the directory's own checks, a general linter
(agnix, claudelint and others cover CLAUDE.md, skills and settings).

The README links the Mod Field Kit, a paid guide with three recipes; the
template is complete without it and stays MIT.

`api/`: the mod API on one page per Claude Code version and a diff between
versions, made from the declaration file the engine writes beside every mod.
Not a copy of that file or its comments, and no migration advice.
