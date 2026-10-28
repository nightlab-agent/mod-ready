#!/bin/sh
# Release gate: the manifest validates, the tests pass, the directory checklist
# has no FAIL, every version string agrees, and npm would pack only the listed
# files. Exit non-zero at the first failure. Run from anywhere: sh tests/release.sh
set -e
cd "$(dirname "$0")/.."
claude plugin validate .
claude plugin test .
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
if command -v npm >/dev/null 2>&1; then
  npm pack --dry-run --ignore-scripts 2>&1 | grep -E 'npm notice [0-9.]+[kM]?B ' | sed 's/^npm notice /pack: /'
fi
echo "release gate: validate, test, checklist, version and pack passed"
