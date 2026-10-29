import type { Register } from 'claude-code'

// mod-ready's example mod: counts the session's tool calls and model steps,
// shows them in the status line and rewrites one small file under the `dir`
// option. Replace the counting with your own mod; keep the shape.
//
// The shape the plugin directory's checks pass:
// - the folder comes from a userConfig option with a fixed default, never
//   from the environment;
// - every write is inside a try, because a failed write must not stop a session;
// - the folder gets a `.gitignore` holding `*` on its first write (unless one
//   is there already), so the counts never land in the user's git history;
// - two hooks (`tool.call` and `turn.step`): another plugin that runs first may
//   pass an event on past later mods, so a mod that listens on one event alone
//   can go quiet without an error. (Observed while building, not tested here.)
// - saves run one after another: a slow write from an earlier call must not
//   land after a newer count (the "out of order" test).

let toolCalls = 0
let steps = 0
let queued = 0 // saves started so far; only the newest one waiting writes
let last: Promise<void> = Promise.resolve()
let ignoredDir = '' // the folder whose .gitignore has been seen to

export const counts = () => ({ toolCalls, steps })

export const fileText = () => `tool calls ${toolCalls}\nsteps ${steps}\n`

export const statusText = () => `tools ${toolCalls} | steps ${steps}`

// `$` may only be handed to a function declared at the top of the module
// (observed: a helper made inside `register` did not load).
async function save($: any, dir: string) {
  const mine = ++queued
  const before = last
  let done = () => {}
  last = new Promise<void>(r => (done = r))
  await before
  try {
    // A newer save is waiting behind this one and will write newer counts.
    if (mine !== queued) return
    try {
      $.ui.status(statusText())
    } catch {
      // a surface with no status line; the file still gets written
    }
    try {
      if (ignoredDir !== dir) {
        if (!(await $.fs.exists(`${dir}/.gitignore`))) await $.fs.write(`${dir}/.gitignore`, '*\n')
        ignoredDir = dir
      }
    } catch {
      // tried again on the next save
    }
    try {
      await $.fs.write(`${dir}/count.txt`, fileText())
    } catch {
      // unwritable folder: the count is advisory, the session goes on
    }
  } finally {
    done()
  }
}

export const register: Register = (on, options) => {
  // The `dir` option, with a fixed default; a relative folder is under the
  // project. Read it when an event runs (observed: options were not filled
  // in yet when `register` itself ran).
  const dir = () => String(options.dir || '.mod-ready')

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (!e.agentId) {
      toolCalls++
      await save($, dir())
    }
    return ran
  })

  on('turn.step', async function* ($, e, next) {
    if (!e.agentId) {
      steps++
      await save($, dir())
    }
    return yield* next(e)
  })
}
