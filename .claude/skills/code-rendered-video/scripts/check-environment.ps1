# Starts check-environment.mjs with whatever JavaScript runtime the machine has.
# When there is none, says how to get one: the checker itself cannot run without it.
#
#   powershell -ExecutionPolicy Bypass -File check-environment.ps1 [the same arguments as check-environment.mjs]
#
# For Windows. On macOS and Linux use check-environment.sh.
# Not yet tried on a Windows machine: written from the documentation.

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$checker = Join-Path $here 'check-environment.mjs'

foreach ($runtime in @('node', 'bun')) {
  $found = Get-Command $runtime -ErrorAction SilentlyContinue
  if ($found) {
    & $found.Source $checker @args
    exit $LASTEXITCODE
  }
}

Write-Host 'Neither Node.js nor Bun was found, so the check cannot run yet.'
Write-Host 'Install Node.js (20 or later; 22 or later for the HyperFrames route):'
if (Get-Command winget -ErrorAction SilentlyContinue) {
  Write-Host '  winget install --id OpenJS.NodeJS.LTS -e'
} elseif (Get-Command scoop -ErrorAction SilentlyContinue) {
  Write-Host '  scoop install nodejs-lts'
} elseif (Get-Command choco -ErrorAction SilentlyContinue) {
  Write-Host '  choco install nodejs-lts'
} else {
  Write-Host '  https://nodejs.org/en/download'
  Write-Host '  (winget comes with "App Installer" from the Microsoft Store)'
}
Write-Host 'Open a new terminal afterwards, so that the new PATH is read, and run this script again.'
exit 1
