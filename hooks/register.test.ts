import { expect, test } from 'claude-code/testing'

// Each test stands for the engine beneath the mod: it answers `$.fs.write`
// and `$.ui.status`, raises tool calls and turn steps, and reads what the mod
// wrote. Nothing here touches the real file system. Counts are module
// variables and carry across tests in one run, so tests assert on deltas.

type Written = { path: string; text: string }

const world = (on: Parameters<Parameters<typeof test>[1]>[1]) => {
  const writes: Written[] = []
  const statuses: (string | undefined)[] = []
  on('fs.write', (_, e) => {
    writes.push({ path: e.path, text: e.text })
    return { value: undefined }
  })
  on('ui.status', (_, e) => {
    statuses.push(e.text)
    return { value: undefined }
  })
  on('tool.call', () => ({ result: {} }))
  on('turn.step', async function* (_, e) {
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [] }
  })
  return { writes, statuses }
}

const step = async ($: Parameters<Parameters<typeof test>[1]>[0], index: number, agentId?: string) => {
  const s = $.turn.step({ turnId: 't1', index, model: 'claude-opus-5-5', messageCount: 3, ...(agentId ? { agentId } : {}) })
  for (;;) {
    const n = await s.next()
    if (n.done) return n.value
  }
}

const count = (text: string, name: string) => Number((text.split('\n').find(l => l.startsWith(name)) ?? '').split(' ').pop())

test('a tool call writes the count under the dir option and sets the status line', { options: { dir: '/counts' } }, async ($, on) => {
  const { writes, statuses } = world(on)
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  expect(writes.length).toBe(1)
  expect(writes[0]!.path).toBe('/counts/count.txt')
  expect(count(writes[0]!.text, 'tool calls')).toBeGreaterThan(0)
  expect(statuses[0]).toMatch(/^tools \d+ \| steps \d+$/)
})

test('a model step is the second door: it counts and writes too', { options: { dir: '/counts' } }, async ($, on) => {
  const { writes } = world(on)
  const before = await step($, 0)
  expect(before.turnId).toBe('t1')
  expect(writes.length).toBe(1)
  expect(count(writes[0]!.text, 'steps')).toBeGreaterThan(0)
})

test('with no option set, the file goes to the fixed default folder', async ($, on) => {
  const { writes } = world(on)
  await $.tool.call({ tool: 'Read', path: 'a.txt' })
  // the engine resolves a relative folder against the project the session runs in
  expect(writes[0]!.path.endsWith('/.mod-ready/count.txt')).toBe(true)
})

test("a subagent's tool call and step are not counted and write nothing", async ($, on) => {
  const { writes } = world(on)
  await $.tool.call({ tool: 'Bash', command: 'ls', agentId: 'sub-1' })
  await step($, 1, 'sub-1')
  expect(writes.length).toBe(0)
})

test('a failed write does not stop the call', async ($, on) => {
  on('fs.write', () => {
    throw new Error('read-only disk')
  })
  on('ui.status', () => ({ value: undefined }))
  on('tool.call', () => ({ result: { ok: true } }))
  const ran = await $.tool.call({ tool: 'Bash', command: 'ls' })
  expect(ran.isError).not.toBe(true)
})
