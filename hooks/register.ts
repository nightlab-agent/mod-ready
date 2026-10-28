import type { Register } from 'claude-code'

// mod-ready's example mod: counts the session's tool calls and model steps,
// shows them in the status line and rewrites one small file under the `dir`
// option. Replace the counting with your own mod; keep the shape.
//
// The shape the plugin directory's checks pass:
// - the folder comes from a userConfig option with a fixed default, never
//   from the environment;
// - every write is inside a try, because a failed write must not stop a session;
// - two doors (`tool.call` and `turn.step`): a security plugin that runs
//   first may pass an event on past later mods, so a mod that listens on one
//   event alone can go quiet without an error.

let toolCalls = 0
let steps = 0

export const counts = () => ({ toolCalls, steps })

export const fileText = () => `tool calls ${toolCalls}\nsteps ${steps}\n`

export const statusText = () => `tools ${toolCalls} | steps ${steps}`

// `$` may only be handed to a function declared at the top of the module
// (the engine follows it there); a helper made inside `register` will not load.
async function save($: any, dir: string) {
  try {
    $.ui.status(statusText())
  } catch {
    // a surface with no status line; the file still gets written
  }
  try {
    await $.fs.write(`${dir}/count.txt`, fileText())
  } catch {
    // unwritable folder: the count is advisory, the session goes on
  }
}

export const register: Register = (on, options) => {
  // The `dir` option, with a fixed default; a relative folder is under the
  // project. Read it when an event runs: options are not filled in yet when
  // `register` itself runs.
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
