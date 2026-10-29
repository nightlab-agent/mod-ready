// Tests for mod-api-index (mod-ready's api/ folder): fixtures in api/tests/fixtures, the committed index, and the CLI's exit codes. No network.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, mkdtempSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, render, diff } from '../bin/mod-api-index.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const repo = join(root, '..')
const bin = join(root, 'bin', 'mod-api-index.mjs')
const fx = n => readFileSync(join(here, 'fixtures', n), 'utf8')
const A = parse(fx('a.d.ts'))
const B = parse(fx('b.d.ts'))
const cli = (...args) => spawnSync(process.execPath, [bin, ...args], { encoding: 'utf8' })

test('the version comes from the first line and the counts are what the fixture declares', () => {
  assert.equal(A.version, '9.9.1')
  assert.deepEqual(A.counts, { lines: 54, exports: 10, events: 3, nouns: 2, members: 3, components: 1, tools: 1 })
})

test('one event name merges its rows across the type maps that name it', () => {
  assert.deepEqual(A.events['tool.call'], { EngineEventOf: 'ToolCallInput', EngineResultOf: 'ToolCallResult' })
  assert.deepEqual(A.events['agent.list'], { OpValueOf: 'AgentInfo[]' })
  assert.ok(!('ghost.event' in A.events), 'a commented-out row is not an event')
})

test('a method signature that spans lines is joined into one', () => {
  const reg = A.nouns.tool.find(m => m.name === 'register')
  assert.equal(reg.sig, '(tool: ToolSpec, extra?: number) => Promise<void>')
  assert.equal(A.nouns.tool.length, 2, 'a doc comment inside the noun adds no member')
})

test('a line comment inside a multi-line signature is not copied into it', () => {
  const s = parse([
    '// Written by Claude Code 9.9.3.',
    'declare module \'claude-code\' {',
    '  export interface CoreEngineInterface {',
    '      fs: {',
    '          write: (path: string,',
    '              // the engine\'s own note: never copied',
    '              text: string) => Promise<void>;',
    '      };',
    '  }',
    '}',
  ].join('\n') + '\n')
  assert.equal(s.nouns.fs[0].sig, '(path: string, text: string) => Promise<void>')
})

test('elements come from ElementConstructor members, with their surfaces and the props of their <Name>Props type', () => {
  assert.deepEqual(A.components, { Text: { props: ['color?', 'bold?'], surfaces: ['terminal'] } })
  assert.deepEqual(A.tools, ['Bash'])
})

test('a file with no version line indexes as unknown rather than failing', () => {
  const s = parse('declare module \'claude-code\' {\n  export type X = {\n      a: string;\n  };\n}\n')
  assert.equal(s.version, 'unknown')
  assert.equal(s.counts.exports, 1)
})

test('the rendered page carries every count and every event name', () => {
  const page = render(A)
  for (const [k, v] of Object.entries(A.counts)) assert.ok(page.includes(`| ${k} | ${v} |`), k)
  for (const ev of Object.keys(A.events)) assert.ok(page.includes(`\`${ev}\``), ev)
  assert.ok(page.includes('`<Text>` (terminal): `color?`, `bold?`'))
})

test('diff names what the next version adds and drops, and finds nothing between a file and itself', () => {
  const d = diff(A, B)
  assert.ok(d.changes >= 5, `changes ${d.changes}`)
  assert.ok(d.text.includes('- added `ui.toast`'))
  assert.ok(d.text.includes('- added `<Box>`'))
  assert.ok(d.text.includes('- added `<Text> on desktop`'))
  assert.ok(d.text.includes('- added `<Box> width?`'))
  assert.ok(d.text.includes('- dropped `tier`'))
  assert.ok(d.text.includes('- added `$.fs.read: (path: string, options?: { as: "bytes" }) => Promise<string>`'))
  assert.equal(diff(A, A).changes, 0)
  assert.ok(diff(A, A).text.includes('No difference'))
})

test('the CLI writes index/<version>/ and exits 0; diff exits 1 on a change and 0 on none', () => {
  const out = mkdtempSync(join(root, 'tests', '.work', 'idx-'))
  const r = cli('index', join(here, 'fixtures', 'a.d.ts'), out)
  assert.equal(r.status, 0, r.stderr)
  assert.ok(existsSync(join(out, '9.9.1', 'README.md')))
  assert.ok(existsSync(join(out, '9.9.1', 'summary.json')))
  const r2 = cli('index', join(here, 'fixtures', 'b.d.ts'), out)
  assert.equal(r2.status, 0, r2.stderr)
  const d = cli('diff', join(out, '9.9.1', 'summary.json'), join(out, '9.9.2', 'summary.json'))
  assert.equal(d.status, 1)
  assert.ok(d.stdout.includes('# 9.9.1 to 9.9.2'))
  assert.equal(cli('diff', join(out, '9.9.1', 'summary.json'), join(out, '9.9.1', 'summary.json')).status, 0)
})

test('a missing input exits 2 and names the path; bad arguments exit 64 with the usage', () => {
  const r = cli('index', '/nowhere/claude-code.d.ts', join(root, 'tests', '.work'))
  assert.equal(r.status, 2)
  assert.ok(r.stderr.includes('/nowhere/claude-code.d.ts'))
  assert.equal(cli().status, 64)
  assert.equal(cli('index').status, 64)
  assert.ok(cli('bogus').stderr.includes('usage'))
})

test('every committed index agrees with itself: the page\'s count table equals its summary, version in the folder name', () => {
  const dirs = readdirSync(join(root, 'index')).filter(d => /^\d+\.\d+\.\d+$/.test(d))
  assert.ok(dirs.length >= 1, 'at least one version is indexed')
  for (const v of dirs) {
    const s = JSON.parse(readFileSync(join(root, 'index', v, 'summary.json'), 'utf8'))
    const page = readFileSync(join(root, 'index', v, 'README.md'), 'utf8')
    assert.equal(s.version, v)
    assert.ok(page.startsWith(`# Claude Code mod API, version ${v}`))
    for (const [k, n] of Object.entries(s.counts)) assert.ok(page.includes(`| ${k} | ${n} |`), `${v} ${k}`)
    assert.equal(page, render(s), `${v}: the page is what render() makes of its summary`)
    for (const ev of ['tool.call', 'turn.step', 'session.start']) assert.ok(ev in s.events, `${v} has ${ev}`)
    for (const noun of ['ui', 'session', 'tool', 'fs']) assert.ok(noun in s.nouns, `${v} has $.${noun}`)
  }
})

test('the version strings move together: the repo\'s package.json, CHANGELOG and README', () => {
  const v = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8')).version
  assert.ok(readFileSync(join(repo, 'CHANGELOG.md'), 'utf8').includes(`## ${v} `), 'CHANGELOG has the version')
  assert.ok(readFileSync(join(repo, 'README.md'), 'utf8').includes(`Version ${v},`), 'README has the version')
})
