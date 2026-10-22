#!/usr/bin/env sh
# Starts check-environment.mjs with whatever JavaScript runtime the machine has.
# When there is none, says how to get one: the checker itself cannot run without it.
#
#   sh check-environment.sh [the same arguments as check-environment.mjs]
#
# For macOS and Linux. On Windows use check-environment.ps1.
set -eu
HERE="$(cd "$(dirname "$0")" && pwd)"

if command -v node >/dev/null 2>&1; then exec node "$HERE/check-environment.mjs" "$@"; fi
if command -v bun >/dev/null 2>&1; then exec bun "$HERE/check-environment.mjs" "$@"; fi

echo "Neither Node.js nor Bun was found, so the check cannot run yet."
echo "Install Node.js (20 or later; 22 or later for the HyperFrames route):"
case "$(uname -s)" in
  Darwin)
    if command -v brew >/dev/null 2>&1; then echo "  brew install node"
    else echo "  first Homebrew, from https://brew.sh, then: brew install node"; fi ;;
  Linux)
    if command -v apt-get >/dev/null 2>&1; then
      echo "  curl -fsSL https://deb.nodesource.com/setup_lts.x -o nodesource_setup.sh"
      echo "  sudo -E bash nodesource_setup.sh && sudo apt install -y nodejs"
      echo "  (the nodejs package of Debian and Ubuntu is too old)"
    elif command -v dnf >/dev/null 2>&1; then echo "  sudo dnf install nodejs"
    elif command -v pacman >/dev/null 2>&1; then echo "  sudo pacman -S nodejs npm"
    else echo "  https://nodejs.org/en/download"; fi ;;
  *) echo "  https://nodejs.org/en/download" ;;
esac
echo "Then run this script again."
exit 1
