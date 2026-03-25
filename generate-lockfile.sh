#!/bin/sh
set -eu

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required to generate package-lock.json" >&2
  exit 1
fi

if [ ! -f package.json ]; then
  echo "Run this script from the repository root" >&2
  exit 1
fi

rm -f package-lock.json
npm install --package-lock-only --ignore-scripts
npm install --package-lock-only

echo "package-lock.json generated. Review the diff, then commit it."
