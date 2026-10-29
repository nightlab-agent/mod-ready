#!/usr/bin/env node
// mod-api-index: index the Claude Code mod API from the type declarations the engine writes beside a mod.
// Usage: mod-api-index index <claude-code.d.ts> <outdir>   writes <outdir>/<version>/{README.md,summary.json}
//        mod-api-index diff <summary-a.json> <summary-b.json> prints what B adds and drops against A (markdown)
// Reads names and signatures only; the engine's doc comments are never copied. No network, no dependencies.
// Exit codes: 0 ran; 1 a difference was found (diff only); 2 an input missing or unreadable; 64 bad arguments.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const EVENT_ROW = /^      '([a-z]+\.[a-zA-Z]+)': (.+);$/
const TOP = /^  export (type|interface|const|function|class) ([A-Za-z_$][A-Za-z0-9_$]*)/

/** Strip one `/** ... *\/` block or `//` line comment; leaves code lines alone. */
function stripComments(lines) {
  const out = []
  let inBlock = false
  for (const line of lines) {
    const t = line.trim()
    if (inBlock) {
      if (t.endsWith('*/')) inBlock = false
      continue
    }
    if (t.startsWith('/**') || t.startsWith('/*')) {
      if (!t.endsWith('*/')) inBlock = true
      continue
    }
    if (t.startsWith('//') || t.startsWith('*')) continue
    out.push(line)
  }
  return out
}

/** Lines from `start` (exclusive) to the line that closes its brace at `indent` spaces. */
function block(lines, start, indent) {
  const close = ' '.repeat(indent) + '}'
  const out = []
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i] === close || lines[i] === close + ';') return out
    out.push(lines[i])
  }
  return out
}

/** Members of an object type at `indent` spaces: name and its first-line signature, multi-line joined to the `;`. */
function members(lines, indent) {
  const pad = ' '.repeat(indent)
  const head = new RegExp(`^${pad}(readonly )?([A-Za-z_$][A-Za-z0-9_$]*|'[^']+'|"[^"]+")(\\?)?:(.*)$`)
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const m = head.exec(lines[i])
    if (!m) continue
    let sig = m[4].trim()
    let depth = (sig.match(/[{(<]/g) || []).length - (sig.match(/[})>]/g) || []).length
    let j = i
    while (j + 1 < lines.length && (!sig.endsWith(';') || depth > 0) && j - i < 40) {
      j++
      const t = lines[j].trim()
      sig += ' ' + t
      depth += (t.match(/[{(<]/g) || []).length - (t.match(/[})>]/g) || []).length
    }
    out.push({ name: m[2].replace(/^['"]|['"]$/g, ''), optional: Boolean(m[3]), sig: sig.replace(/;$/, '').replace(/\s+/g, ' ').slice(0, 300) })
  }
  return out
}

export function parse(text) {
  const raw = text.split('\n')
  const first = raw[0] || ''
  const vm = /Claude Code (\d+\.\d+\.\d+)/.exec(first)
  const lines = stripComments(raw)
  const exports = []
  const eventMaps = {}
  const nouns = {}
  const propTypes = {}
  const ctor = {}
  let tools = []
  let surface = ''
  for (const l of lines) {
    const s6 = /^      ([a-z][A-Za-z]*): \{$/.exec(l)
    if (s6) surface = s6[1]
    const k = /^\s+([A-Z][A-Za-z]*): ElementConstructor<[A-Za-z]+>;$/.exec(l)
    if (k) (ctor[k[1]] ||= new Set()).add(surface)
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const m = TOP.exec(line)
    if (!m) continue
    exports.push({ kind: m[1], name: m[2] })
    const body = line.endsWith('{') ? block(lines, i, 2) : []
    if (!body.length) continue
    const rows = {}
    for (const l of body) { const r = EVENT_ROW.exec(l); if (r) rows[r[1]] = r[2] }
    if (Object.keys(rows).length) eventMaps[m[2]] = rows
    if (m[2] === 'CoreEngineInterface' || m[2] === 'EngineInterface') {
      for (let j = 0; j < body.length; j++) {
        const n = /^      ([a-z][A-Za-z]*): \{$/.exec(body[j])
        if (!n) continue
        nouns[n[1]] = members(block(body, j, 6), 10)
      }
    }
    if (m[2] === 'BuiltinToolInputs') tools = members(body, 6).map(x => x.name)
    const c = /^([A-Z][A-Za-z]*)Props$/.exec(m[2])
    if (c && m[1] === 'type') propTypes[c[1]] = members(body, 6).map(x => x.name + (x.optional ? '?' : ''))
  }
  const components = {}
  for (const name of Object.keys(ctor).sort()) components[name] = { props: propTypes[name] || [], surfaces: [...ctor[name]] }
  const events = {}
  for (const [map, rows] of Object.entries(eventMaps)) for (const [ev, type] of Object.entries(rows)) (events[ev] ||= {})[map] = type
  return {
    version: vm ? vm[1] : 'unknown',
    firstLine: first.trim(),
    counts: { lines: raw.length - (text.endsWith('\n') ? 1 : 0), exports: exports.length, events: Object.keys(events).length, nouns: Object.keys(nouns).length,
      members: Object.values(nouns).reduce((a, b) => a + b.length, 0), components: Object.keys(components).length, tools: tools.length },
    events, nouns, components, tools, exports,
  }
}

function esc(s) { return s.replace(/\|/g, '\\|') }

export function render(s) {
  const o = []
  const maps = [...new Set(Object.values(s.events).flatMap(Object.keys))]
  o.push(`# Claude Code mod API, version ${s.version}`, '',
    `Indexed from the declaration file the engine writes beside a mod (its first line: \`${s.firstLine}\`).`,
    'Names and signatures only; the file\'s own comments are not copied. Generated by `mod-api-index`.', '',
    '| Count | |', '|---|---|',
    ...Object.entries(s.counts).map(([k, v]) => `| ${k} | ${v} |`), '',
    '## Events', '', `One row per event name; the columns are the type maps that name it (${maps.join(', ')}).`, '',
    `| Event | ${maps.join(' | ')} |`, `|---|${maps.map(() => '---').join('|')}|`)
  for (const ev of Object.keys(s.events).sort()) o.push(`| \`${ev}\` | ${maps.map(m => s.events[ev][m] ? `\`${esc(s.events[ev][m])}\`` : '').join(' | ')} |`)
  o.push('', '## `$` nouns and their members', '')
  for (const [noun, ms] of Object.entries(s.nouns)) {
    o.push(`### \`$.${noun}\` (${ms.length})`, '')
    for (const m of ms) o.push(`- \`${m.name}${m.optional ? '?' : ''}: ${m.sig}\``)
    o.push('')
  }
  o.push('## UI elements (`ElementConstructor` members, with the surfaces that declare each)', '')
  for (const [c, v] of Object.entries(s.components)) o.push(`- \`<${c}>\` (${v.surfaces.join(', ')}): ${v.props.map(p => `\`${p}\``).join(', ') || '(no props type found)'}`)
  o.push('', '## Builtin tool names (`BuiltinToolInputs`)', '', s.tools.length ? s.tools.map(t => `\`${t}\``).join(', ') : 'None declared in this version: the interface is empty and a mod augments it with the tools it types.', '',
    `## All exports (${s.exports.length})`, '', '<details><summary>names</summary>', '',
    ...s.exports.map(e => `- ${e.kind} \`${e.name}\``), '', '</details>', '')
  return o.join('\n')
}

export function diff(a, b) {
  const o = [`# ${a.version} to ${b.version}`, '']
  let n = 0
  const set = (title, A, B) => {
    const add = B.filter(x => !A.includes(x)).sort(), drop = A.filter(x => !B.includes(x)).sort()
    n += add.length + drop.length
    if (add.length || drop.length) o.push(`## ${title}: +${add.length} -${drop.length}`, '', ...add.map(x => `- added \`${x}\``), ...drop.map(x => `- dropped \`${x}\``), '')
  }
  set('events', Object.keys(a.events), Object.keys(b.events))
  set('nouns', Object.keys(a.nouns), Object.keys(b.nouns))
  const sigs = s => Object.entries(s.nouns).flatMap(([k, ms]) => ms.map(m => `$.${k}.${m.name}: ${m.sig}`))
  set('noun members (name and signature)', sigs(a), sigs(b))
  set('elements', Object.keys(a.components).map(c => `<${c}>`), Object.keys(b.components).map(c => `<${c}>`))
  const props = s => Object.entries(s.components).flatMap(([k, v]) => v.props.map(p => `<${k}> ${p}`))
  set('element props', props(a), props(b))
  const surf = s => Object.entries(s.components).flatMap(([k, v]) => v.surfaces.map(x => `<${k}> on ${x}`))
  set('element surfaces', surf(a), surf(b))
  set('builtin tools', a.tools, b.tools)
  set('exports', a.exports.map(e => e.name), b.exports.map(e => e.name))
  if (!n) o.push('No difference in the indexed names and signatures.', '')
  return { text: o.join('\n'), changes: n }
}

function read(p) {
  try { return readFileSync(p, 'utf8') } catch (e) { console.error(`mod-api-index: cannot read ${p}: ${e.code || e.message}`); process.exit(2) }
}

function main(argv) {
  const [cmd, a, b] = argv
  if (cmd === 'index' && a && b) {
    const s = parse(read(a))
    const dir = join(b, s.version)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'summary.json'), JSON.stringify(s, null, 1) + '\n')
    writeFileSync(join(dir, 'README.md'), render(s))
    console.log(`indexed ${s.version}: ${Object.entries(s.counts).map(([k, v]) => `${k} ${v}`).join(', ')} -> ${dir}/`)
    return 0
  }
  if (cmd === 'diff' && a && b) {
    const d = diff(JSON.parse(read(a)), JSON.parse(read(b)))
    process.stdout.write(d.text)
    return d.changes ? 1 : 0
  }
  console.error('usage: mod-api-index index <claude-code.d.ts> <outdir> | diff <summary-a.json> <summary-b.json>')
  return 64
}

if (process.argv[1] && /mod-api-index\.mjs$/.test(process.argv[1])) process.exit(main(process.argv.slice(2)))
