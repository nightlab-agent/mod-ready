#!/bin/sh
# Turn this template into your own mod.
# Usage: sh scripts/new-mod.sh <mod-name> "<one-sentence description>" <github-owner>
# Renames the mod in every manifest, points the links at github.com/<owner>/<mod-name>,
# resets the version to 0.1.0, starts a fresh CHANGELOG and README, and removes the
# template's own working notes. Run it once, from a fresh clone, then: sh tests/release.sh
set -e
cd "$(dirname "$0")/.."
name="$1"; desc="$2"; owner="$3"
if [ -z "$name" ] || [ -z "$desc" ] || [ -z "$owner" ]; then
  echo 'usage: sh scripts/new-mod.sh <mod-name> "<one-sentence description>" <github-owner>' >&2
  exit 64
fi
case "$name" in
  *[!a-z0-9-]*|-*) echo "new-mod: the name must be lowercase letters, digits and dashes: $name" >&2; exit 64 ;;
esac
NAME="$name" DESC="$desc" OWNER="$owner" python3 -I - <<'PY'
import json, os
name, desc, owner = os.environ['NAME'], os.environ['DESC'], os.environ['OWNER']
url = f'https://github.com/{owner}/{name}'

def edit(path, change):
    data = json.load(open(path))
    change(data)
    open(path, 'w').write(json.dumps(data, indent=2, ensure_ascii=False) + '\n')

def plugin(d):
    d.update(name=name, version='0.1.0', description=desc, homepage=url + '#readme', repository=url)
    d['author'] = {'name': owner}
    d['keywords'] = ['claude-code-mod']
    d['userConfig']['dir']['default'] = f'.{name}'

def market(d):
    d['name'] = f'{owner}-{name}'.lower()
    d['owner'] = {'name': owner}
    d['description'] = desc
    d['plugins'][0].update(name=name, description=desc, version='0.1.0')

def package(d):
    d.update(name=name, version='0.1.0', description=desc, homepage=url + '#readme',
             bugs=url + '/issues', author=owner)
    d['repository'] = {'type': 'git', 'url': url}
    d['keywords'] = ['claude-code', 'claude-code-mod', 'claude-code-plugin']

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
    f'## Install\n\n```\n/plugin install {name} --marketplace {owner}/{name}\n```\n\n'
    'Started from [mod-ready](https://github.com/nightlab-agent/mod-ready).\n')
PY
# The template's own working notes and release file are not part of your mod.
for f in CLAUDE.md AGENTS.md nightlab-release.json; do rm -f "$f"; done
for d in 00-catalog 01-context 04-memory; do [ -d "$d" ] && rm -r "$d"; done
rm -f scripts/new-mod.sh
echo "new-mod: $name is ready; edit hooks/register.ts and README.md, then run: sh tests/release.sh"
