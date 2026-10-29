#!/bin/sh
# The api/ folder's part of the release check: its tests, a type check of the script, file sizes, and a
# planted bug that must fail the tests. tests/release.sh at the repo root runs this; it also runs alone:
# sh api/tests/release.sh
set -e
cd "$(dirname "$0")/.."
mkdir -p tests/.work
node --test tests/index.test.mjs
# Type check the script (JS with checkJs). TSC and TYPES default to Nightlab's tools folder; a missing tsc or
# missing Node types fails, never skips.
TSC=${TSC:-/nightlab/tools/node_modules/.bin/tsc}
TYPES=${TYPES:-/nightlab/tools/node_modules/@types}
[ -x "$TSC" ] || { echo "api: FAIL no tsc at $TSC (set TSC)"; exit 1; }
[ -d "$TYPES/node" ] || { echo "api: FAIL no Node types at $TYPES/node (npm install @types/node, set TYPES to its @types folder)"; exit 1; }
"$TSC" --noEmit --allowJs --checkJs --noImplicitAny false --useUnknownInCatchVariables false --target es2022 --module nodenext --moduleResolution nodenext --typeRoots "$TYPES" --types node bin/mod-api-index.mjs
for f in bin/mod-api-index.mjs tests/index.test.mjs tests/release.sh; do
  n=$(wc -l < "$f"); [ "$n" -le 400 ] || { echo "api: FAIL $f has $n lines"; exit 1; }
done
# Planted bug: a parser that skips interfaces loses the nouns and the tools; the tests must catch it.
rm -rf tests/.work/mut.* 2>/dev/null || true
m=$(mktemp -d tests/.work/mut.XXXXXX) || exit 1
mkdir -p "$m/api/bin" "$m/api/tests/.work" "$m/api/index"
cp -r tests/fixtures tests/index.test.mjs "$m/api/tests/"; cp -r index/* "$m/api/index/"; cp ../package.json ../CHANGELOG.md ../README.md "$m/"
# The copy passes with the real script first, so the failure below is the planted bug, not the copy.
cp bin/mod-api-index.mjs "$m/api/bin/"
node --test "$m/api/tests/index.test.mjs" >/dev/null 2>&1 || { echo "api: FAIL the unchanged copy does not pass; the planted-bug check would prove nothing"; exit 1; }
sed 's/if (!m) continue$/if (!m || m[1] === "interface") continue/' bin/mod-api-index.mjs > "$m/api/bin/mod-api-index.mjs"
cmp -s bin/mod-api-index.mjs "$m/api/bin/mod-api-index.mjs" && { echo "api: FAIL mutation did not apply"; exit 1; }
if node --test "$m/api/tests/index.test.mjs" >/dev/null 2>&1; then echo "api: FAIL a parser that skips interfaces still passes the tests"; exit 1; fi
rm -rf "$m" 2>/dev/null || true
echo "api: tests, type check, sizes and the planted parser bug passed"
