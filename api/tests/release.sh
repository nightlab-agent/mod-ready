#!/bin/sh
# The api/ folder's part of the release check: its tests, a type check of the script, file sizes, and a
# planted bug that must fail the tests. tests/release.sh at the repo root runs this; it also runs alone:
# sh api/tests/release.sh
set -e
cd "$(dirname "$0")/.."
mkdir -p tests/.work
node --test tests/index.test.mjs
# Type check the script (JS with checkJs). Needs TypeScript and Node's type declarations (@types/node);
# a missing one FAILS with what to install, it never skips.
# tsc: TSC if set (a path or a command on PATH), else `npx --no-install tsc`, else `tsc` on PATH.
# Node types: TYPES if set (an @types folder holding node/), else node_modules/@types at the repo root,
# else the @types folder beside the tsc in use (<dir>/node_modules/.bin/tsc -> <dir>/node_modules/@types).
# Install both: npm install --save-dev typescript @types/node   (from the repo root)
if [ -n "${TSC:-}" ]; then
  tsc="$(command -v "$TSC" || true)"
  [ -n "$tsc" ] && [ -x "$tsc" ] || { echo "api: FAIL TSC=$TSC is not an executable or a command on PATH"; exit 1; }
  set -- "$tsc"
elif command -v npx >/dev/null 2>&1 && npx --no-install tsc --version >/dev/null 2>&1; then
  tsc=""; set -- npx --no-install tsc
elif command -v tsc >/dev/null 2>&1; then
  tsc="$(command -v tsc)"; set -- tsc
else
  echo "api: FAIL no TypeScript compiler. Install it: npm install --save-dev typescript @types/node (or set TSC)"; exit 1
fi
types="${TYPES:-}"
[ -n "$types" ] || { [ -d ../node_modules/@types/node ] && types=../node_modules/@types; }
[ -n "$types" ] || { case "$tsc" in */node_modules/.bin/tsc) types="${tsc%/.bin/tsc}/@types" ;; esac; }
[ -n "$types" ] && [ -d "$types/node" ] || { echo "api: FAIL no Node type declarations (looked in: ${types:-TYPES unset, ../node_modules/@types}). Install them: npm install --save-dev @types/node, or set TYPES to the @types folder that holds node/"; exit 1; }
"$@" --noEmit --allowJs --checkJs --noImplicitAny false --useUnknownInCatchVariables false --target es2022 --module nodenext --moduleResolution nodenext --typeRoots "$types" --types node bin/mod-api-index.mjs
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
echo "api: tests, type check, file sizes and the planted parser bug passed"
