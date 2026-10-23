#!/usr/bin/env bash
set -euo pipefail

cd /workspace/-
node_version="$(node -p 'process.versions.node')"
archive="node-v${node_version}-win-x64.zip"
base_url="https://nodejs.org/dist/v${node_version}"
cache_dir="/workspace/.node-windows-cache"
mkdir -p "$cache_dir" dist

if [ ! -s "$cache_dir/$archive" ]; then
  curl --fail --location --retry 3 --silent --show-error "$base_url/$archive" -o "$cache_dir/$archive"
fi
curl --fail --location --retry 3 --silent --show-error "$base_url/SHASUMS256.txt" -o "$cache_dir/SHASUMS256.txt"
expected="$(awk -v name="$archive" '$2 == name { print $1 }' "$cache_dir/SHASUMS256.txt")"
if [ -z "$expected" ]; then
  echo "Official SHA256 entry not found for $archive" >&2
  exit 1
fi
printf '%s  %s\n' "$expected" "$cache_dir/$archive" | sha256sum --check --status

env -u IMAGE_API_KEY -u OPENAI_API_KEY npm run build
stage="$(mktemp -d /workspace/-/dist/story-studio-windows.XXXXXX)"
trap 'rm -rf "$stage"' EXIT
mkdir -p "$stage/app/.next/static" "$stage/runtime"
cp -a .next/standalone/. "$stage/app/"
cp -a .next/static/. "$stage/app/.next/static/"
if [ -d public ]; then cp -a public "$stage/app/public"; fi
unzip -p "$cache_dir/$archive" "node-v${node_version}-win-x64/node.exe" > "$stage/runtime/node.exe"
unzip -p "$cache_dir/$archive" "node-v${node_version}-win-x64/LICENSE" > "$stage/runtime/NODE-LICENSE.txt"

# Next's standalone trace includes Linux Sharp binaries when built on Linux.
# Replace them with the matching Windows binary recorded in the lockfile.
sharp_package="node_modules/@img/sharp-win32-x64"
sharp_url="$(node -p 'require("./package-lock.json").packages["node_modules/@img/sharp-win32-x64"].resolved')"
sharp_archive="$cache_dir/sharp-win32-x64.tgz"
if [ ! -s "$sharp_archive" ]; then
  curl --fail --location --retry 3 --silent --show-error "$sharp_url" -o "$sharp_archive"
fi
node - "$sharp_archive" <<'NODE'
const crypto = require('node:crypto');
const fs = require('node:fs');
const lock = require('./package-lock.json').packages['node_modules/@img/sharp-win32-x64'];
const actual = 'sha512-' + crypto.createHash('sha512').update(fs.readFileSync(process.argv[2])).digest('base64');
if (actual !== lock.integrity) throw new Error('Windows Sharp package failed lockfile integrity check');
NODE
mkdir -p "$stage/app/$sharp_package"
tar -xzf "$sharp_archive" --strip-components=1 -C "$stage/app/$sharp_package"
find "$stage/app/node_modules/@img" -maxdepth 1 -type d -name '*linux*' -exec rm -rf -- {} +

cp packaging/launcher.cjs packaging/使用说明.txt "$stage/"
sed 's/$/\r/' 'packaging/Start Studio.bat' > "$stage/Start Studio.bat"

package="/workspace/-/dist/story-studio-windows-x64.zip"
rm -f "$package"
(
  cd "$stage"
  zip -qr "$package" .
)
sha256sum "$package" > "$package.sha256"
delivery_dir="/workspace/scratch"
mkdir -p "$delivery_dir"
delivery="$delivery_dir/story-studio-windows-x64-$(date -u +%Y%m%dT%H%M%SZ).zip"
install -m 0644 "$package" "$delivery"
unzip -tq "$delivery"
(
  cd "$delivery_dir"
  sha256sum "$(basename "$delivery")" > "$(basename "$delivery").sha256"
)
echo "$delivery"
du -h "$delivery"
