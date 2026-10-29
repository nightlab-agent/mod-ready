#!/bin/sh
# Turn this template into your own mod.
# Usage: sh scripts/new-mod.sh <mod-name> "<one-sentence description>" <github-user>
# Renames the mod in every manifest, points the links at github.com/<github-user>/<mod-name>,
# resets the version to 0.1.0, starts a fresh CHANGELOG and README, adds node_modules/ to
# .gitignore, and deletes what belongs to the template only: its maintainer notes (CLAUDE.md,
# AGENTS.md, 00-catalog/, 01-context/, 04-memory/), api/, skills/mod-ready/,
# nightlab-release.json and this script. Run it once, from a fresh clone, then: sh tests/release.sh
set -e
cd "$(dirname "$0")/.."
name="$1"; desc="$2"; ghuser="$3"
if [ -z "$name" ] || [ -z "$desc" ] || [ -z "$ghuser" ]; then
  echo 'usage: sh scripts/new-mod.sh <mod-name> "<one-sentence description>" <github-user>' >&2
  exit 64
fi
case "$name" in
  *[!a-z0-9-]*|-*) echo "new-mod: the name must be lowercase letters, digits and dashes: $name" >&2; exit 64 ;;
esac
NAME="$name" DESC="$desc" GHUSER="$ghuser" python3 -I - <<'PY'
import json, os
name, desc, ghuser = os.environ['NAME'], os.environ['DESC'], os.environ['GHUSER']
url = f'https://github.com/{ghuser}/{name}'

def edit(path, change):
    data = json.load(open(path))
    change(data)
    open(path, 'w').write(json.dumps(data, indent=2, ensure_ascii=False) + '\n')

def plugin(d):
    d.update(name=name, version='0.1.0', description=desc, homepage=url + '#readme', repository=url)
    d['author'] = {'name': ghuser}
    d['keywords'] = ['claude-code-mod']
    d['userConfig']['dir']['default'] = f'.{name}'

def market(d):
    d['name'] = f'{ghuser}-{name}'.lower()
    d['owner'] = {'name': ghuser}
    d['description'] = desc
    d['plugins'][0].update(name=name, description=desc, version='0.1.0')

def package(d):
    d.update(name=name, version='0.1.0', description=desc, homepage=url + '#readme',
             bugs=url + '/issues', author=ghuser)
    d['repository'] = {'type': 'git', 'url': url}
    d['keywords'] = ['claude-code', 'claude-code-mod', 'claude-code-plugin']
    d['files'] = [f for f in d.get('files', []) if f not in ('skills/', 'scripts/new-mod.sh')]  # neither the template's skill nor this script is part of your mod

edit('.claude-plugin/plugin.json', plugin)
edit('.claude-plugin/marketplace.json', market)
edit('package.json', package)
for path in ('hooks/register.ts', 'hooks/register.test.ts'):
    s = open(path).read().replace("'.mod-ready'", f"'.{name}'").replace('/.mod-ready/', f'/.{name}/')
    s = s.replace("mod-ready's example mod:", f'{name}, started from the mod-ready example:')
    open(path, 'w').write(s)
open('CHANGELOG.md', 'w').write(
    '# Changelog\n\n## [Unreleased]\n\n## 0.1.0 - first release\n\n### Added\n- Started from the mod-ready template.\n')
readme = open('README.md').read()
start = readme.index('## What the example mod does')
end = readme.index('## Install the example as it is')
open('README.md', 'w').write(
    f'# {name}\n\n{desc}\n\nVersion 0.1.0, MIT.\n\n' + readme[start:end].replace('`.mod-ready`', f'`.{name}`') +
    f'## Install\n\n```\n/plugin install {name} --marketplace {ghuser}/{name}\n```\n\n'
    'Started from [mod-ready](https://github.com/nightlab-agent/mod-ready).\n')
lines = open('.gitignore').read().splitlines() if os.path.exists('.gitignore') else []
if 'node_modules/' not in lines:
    open('.gitignore', 'w').write('\n'.join(lines + ['node_modules/']) + '\n')
PY
# The template's maintainer notes, its release-tool file and the API index (api/) are not part of your mod.
for f in CLAUDE.md AGENTS.md nightlab-release.json; do rm -f "$f"; done
for d in 00-catalog 01-context 04-memory skills/mod-ready api; do [ -d "$d" ] && rm -r "$d"; done
[ -d skills ] && rmdir skills 2>/dev/null || true
rm -f scripts/new-mod.sh
echo "new-mod: $name is ready; edit hooks/register.ts and README.md, then run: sh tests/release.sh"
