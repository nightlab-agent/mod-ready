import { expect, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

// Each test stands for the engine beneath the mod: it answers `$.fs.write`,
// `$.fs.exists` and `$.ui.status`, raises tool calls and turn steps, and reads
// what the mod wrote. Nothing here touches the real file system. Counts are
// module variables and carry across tests in one run, so tests assert on deltas.

type Written = { path: string; text: string }

// `hold`: when set, the first write waits until it resolves (a slow disk).
// `stepHold`: when set, a main-session step waits until it resolves (a long model call).
// `exists`: what `$.fs.exists` answers (is there a .gitignore already).
type World = { hold?: Promise<void>; stepHold?: Promise<void>; exists?: boolean }
const world = (on: Parameters<TestBody>[1], { hold, stepHold, exists = false }: World = {}) => {
  const writes: Written[] = []
  const statuses: (string | undefined)[] = []
  let held = false
  let entered = () => {}
  const writing = new Promise<void>(r => (entered = r))
  on('fs.write', async (_, e) => {
    if (hold && !held) {
      held = true
      entered()
      await hold
    }
    writes.push({ path: e.path, text: e.text })
    return { value: undefined }
  })
  on('fs.exists', () => ({ value: exists }))
  on('ui.status', (_, e) => {
    statuses.push(e.text)
    return { value: undefined }
  })
  on('tool.call', () => ({ result: {} }))
  on('turn.step', async function* (_, e) {
    if (stepHold && !e.agentId) await stepHold
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'end_turn', usage: null }
  })
  return { writes, statuses, writing }
}

const step = async ($: Parameters<TestBody>[0], index: number, agentId?: string, turnId = 't1') => {
  const s = $.turn.step({ turnId, index, model: 'claude-opus-5-5', messageCount: 3, ...(agentId ? { agentId } : {}) })
  for (;;) {
    const n = await s.next()
    if (n.done) return n.value
  }
}

const count = (text: string, name: string) => Number((text.split('\n').find(l => l.startsWith(name)) ?? '').split(' ').pop())
const counted = (writes: Written[]) => writes.filter(w => w.path.endsWith('/count.txt'))
// Lets every other pending call run as far as it can before the test goes on.
const later = async () => {
  for (let i = 0; i < 200; i++) await Promise.resolve()
}

test('a tool call writes the count under the dir option and sets the status line', { options: { dir: '/counts' } }, async ($, on) => {
  const { writes, statuses } = world(on)
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  const c = counted(writes)
  expect(c.length).toBe(1)
  expect(c[0]!.path).toBe('/counts/count.txt')
  expect(count(c[0]!.text, 'tool calls')).toBeGreaterThan(0)
  expect(statuses[0]).toMatch(/^tools \d+ \| steps \d+$/)
})

test('a model step is the second hook: it counts and writes too', { options: { dir: '/counts' } }, async ($, on) => {
  const { writes } = world(on)
  const before = await step($, 0)
  expect(before.turnId).toBe('t1')
  const c = counted(writes)
  expect(c.length).toBe(1)
  expect(count(c[0]!.text, 'steps')).toBeGreaterThan(0)
})

test('with no option set, the file goes to the fixed default folder', async ($, on) => {
  const { writes } = world(on)
  await $.tool.call({ tool: 'Read', file_path: 'a.txt' })
  // the engine resolves a relative folder against the project the session runs in
  expect(counted(writes)[0]!.path.endsWith('/.mod-ready/count.txt')).toBe(true)
})

test('the first write in a folder also writes a .gitignore holding *, once', { options: { dir: '/fresh' } }, async ($, on) => {
  const { writes } = world(on)
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  const ignores = writes.filter(w => w.path === '/fresh/.gitignore')
  expect(ignores.length).toBe(1)
  expect(ignores[0]!.text).toBe('*\n')
})

test('an existing .gitignore in the folder is left as it is', { options: { dir: '/kept' } }, async ($, on) => {
  const { writes } = world(on, { exists: true })
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  expect(writes.filter(w => w.path.endsWith('.gitignore')).length).toBe(0)
  expect(counted(writes).length).toBe(1)
})

test("a subagent's tool call and step are not counted and write nothing", async ($, on) => {
  const { writes } = world(on)
  await $.tool.call({ tool: 'Bash', command: 'ls', agentId: 'sub-1' })
  await step($, 1, 'sub-1')
  expect(counted(writes).length).toBe(0)
})

test('out of order: a slow write from an earlier call does not overwrite a newer count', { options: { dir: '/order' } }, async ($, on) => {
  let release = () => {}
  const hold = new Promise<void>(r => (release = r))
  const { writes, statuses, writing } = world(on, { hold, exists: true }) // exists: no .gitignore write here
  const first = $.tool.call({ tool: 'Bash', command: 'ls' })
  await writing // the first call's write is now stuck on a slow disk
  const second = $.tool.call({ tool: 'Bash', command: 'pwd' })
  await later()
  release()
  await Promise.all([first, second])
  const c = counted(writes)
  const newest = Math.max(...c.map(w => count(w.text, 'tool calls')))
  expect(count(c[c.length - 1]!.text, 'tool calls')).toBe(newest)
  expect(statuses[statuses.length - 1]).toBe(`tools ${newest} | steps ${count(c[c.length - 1]!.text, 'steps')}`)
})

test("two at once: a subagent's call and step during a main step leave only the main step counted", { options: { dir: '/both' } }, async ($, on) => {
  let release = () => {}
  const stepHold = new Promise<void>(r => (release = r))
  const { writes } = world(on, { stepHold, exists: true })
  const main = step($, 0, undefined, 't2')
  await later()
  await $.tool.call({ tool: 'Bash', command: 'ls', agentId: 'sub-2' })
  await step($, 0, 'sub-2', 't2')
  release()
  await main
  const c = counted(writes)
  expect(c.length).toBe(1) // the main step only
  const after = c[0]!.text
  await $.tool.call({ tool: 'Read', file_path: 'a.txt' })
  const next = counted(writes)[1]!.text
  expect(count(next, 'tool calls')).toBe(count(after, 'tool calls') + 1)
  expect(count(next, 'steps')).toBe(count(after, 'steps'))
})

test('look-alikes: a tool call and a model step each raise only their own line, by one', { options: { dir: '/alike' } }, async ($, on) => {
  const { writes } = world(on, { exists: true })
  await $.tool.call({ tool: 'Read', file_path: 'a.txt' })
  const a = counted(writes).at(-1)!.text
  await step($, 0)
  const b = counted(writes).at(-1)!.text
  await $.tool.call({ tool: 'mcp__docs__Read', arguments: {} } as never)
  const c = counted(writes).at(-1)!.text
  expect(count(b, 'tool calls')).toBe(count(a, 'tool calls'))
  expect(count(b, 'steps')).toBe(count(a, 'steps') + 1)
  expect(count(c, 'tool calls')).toBe(count(b, 'tool calls') + 1)
  expect(count(c, 'steps')).toBe(count(b, 'steps'))
})

test('a failed write does not stop the call', async ($, on) => {
  on('fs.write', () => {
    throw new Error('read-only disk')
  })
  on('fs.exists', () => ({ value: false }))
  on('ui.status', () => ({ value: undefined }))
  on('tool.call', () => ({ result: { ok: true } }))
  const ran = await $.tool.call({ tool: 'Bash', command: 'ls' })
  expect(ran.isError).not.toBe(true)
})
