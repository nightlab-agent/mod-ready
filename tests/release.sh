#!/bin/sh
# The release check. Stops at the first failure (exit non-zero). Run from anywhere: sh tests/release.sh
# Steps, in order:
#   1. claude plugin validate .        the manifest schema
#   2. claude plugin test .            the tests in hooks/*.test.ts
#   3. sh tests/typecheck.sh           tsc --noEmit against the engine's declarations (needs TypeScript
#                                      and the declarations; see that file)
#   4. sh api/tests/release.sh         only when api/ exists (new-mod.sh removes it)
#   5. python3 -I tests/checklist.py   the plugin directory checklist
#   6. version check                   one version string in five files
#   7. npm pack --dry-run              only when npm is installed; prints what the tarball would hold
# The last line names every step that ran.
set -e
cd "$(dirname "$0")/.."
claude plugin validate .
claude plugin test .
sh tests/typecheck.sh
ran="validate, test, type check"
if [ -d api ]; then sh api/tests/release.sh; ran="$ran, api checks"; fi
python3 -I tests/checklist.py
python3 -I - <<'PY'
import json, re, sys
plugin = json.load(open('.claude-plugin/plugin.json'))['version']
market = json.load(open('.claude-plugin/marketplace.json'))['plugins'][0]['version']
changelog = re.search(r'^## (\d+\.\d+\.\d+) ', open('CHANGELOG.md').read(), re.M).group(1)
package = json.load(open('package.json'))['version']
readme = re.search(r'Version (\d+\.\d+\.\d+),', open('README.md').read()).group(1)
versions = {'plugin.json': plugin, 'marketplace.json': market, 'CHANGELOG.md': changelog, 'README.md': readme, 'package.json': package}
if len(set(versions.values())) != 1:
    sys.exit(f"version strings differ: {versions}")
print(f"version check: all five say {plugin}")
PY
ran="$ran, checklist, version check"
if command -v npm >/dev/null 2>&1; then
  packed=$(npm pack --dry-run --ignore-scripts 2>&1)
  printf '%s\n' "$packed" | grep -E 'npm notice [0-9.]+[kM]?B ' | sed 's/^npm notice /pack: /'
  ran="$ran, pack"
else
  echo "pack: skipped, npm is not installed"
fi
echo "release check passed: $ran"
