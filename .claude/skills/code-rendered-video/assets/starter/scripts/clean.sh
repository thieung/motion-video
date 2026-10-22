#!/bin/sh
# Removes what this app folder makes for itself and does not ship: the installed packages, the
# captures in out/, build caches, and the Python environment of the music analysis.
# Run from anywhere: sh scripts/clean.sh
# `bun install` brings the packages back; the Python environment is made again (see README.md).
set -eu
APP="$(cd "$(dirname "$0")/.." && pwd)"
for d in node_modules out dist .vite analysis/python-env; do
  if [ -e "$APP/$d" ]; then rm -rf "${APP:?}/$d"; echo "removed $d"; fi
done
