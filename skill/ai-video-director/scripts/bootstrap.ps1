# Agent entrypoint; no machine-wide PATH edits or administrator shell needed for Node.
$ErrorActionPreference = 'Stop'
$avdData = if ($env:AI_VIDEO_DIRECTOR_DATA_DIR) { $env:AI_VIDEO_DIRECTOR_DATA_DIR } else { Join-Path $env:USERPROFILE '.local/share/ai-video-director' }
$avdRuntime = Join-Path $avdData 'runtime'
$avdArgs = @($args)
$avdFresh = $avdArgs.Count -gt 0 -and $avdArgs[0] -eq '--fresh-node'
if ($avdFresh) { $avdArgs = @($avdArgs | Select-Object -Skip 1) }
if (-not $avdFresh) {
  $avdCandidates = @()
  $avdExisting = Get-Command node -ErrorAction SilentlyContinue
  if ($avdExisting) { $avdCandidates += $avdExisting.Source }
  $avdCandidates += Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node.exe'
  $avdCandidates += Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
  $avdCandidates += @(Get-ChildItem $avdRuntime -Directory -Filter 'node-v*' -ErrorAction SilentlyContinue | ForEach-Object { Join-Path $_.FullName 'node.exe' })
  foreach ($avdNode in $avdCandidates) {
    if (Test-Path $avdNode -PathType Leaf) {
      & $avdNode (Join-Path $PSScriptRoot 'check-node.mjs') 2>$null
      if ($LASTEXITCODE -eq 0) { & $avdNode (Join-Path $PSScriptRoot 'setup.mjs') @avdArgs; exit $LASTEXITCODE }
    }
  }
}
if ($avdArgs -notcontains '--apply') { throw 'Node >=22 is missing. Agent reruns bootstrap with --apply to acquire the pinned runtime.' }
$avdMachineArch = if ($env:PROCESSOR_ARCHITEW6432) { $env:PROCESSOR_ARCHITEW6432 } else { $env:PROCESSOR_ARCHITECTURE }
$avdArch = switch ($avdMachineArch) { 'ARM64' {'arm64'} 'AMD64' {'x64'} default { throw 'Agent must review an official Node distribution for this CPU.' } }
$avdName = "node-v22.23.2-win-$avdArch"
$avdArchive = "$avdName.zip"
$avdChecksum = Get-Content (Join-Path $PSScriptRoot '../references/node-downloads.txt') | Where-Object { $_.StartsWith("$avdArchive ") }
$avdExpected = ($avdChecksum -split ' ')[1]
if ($avdExpected -notmatch '^[0-9a-f]{64}$') { throw 'Missing pinned Node checksum.' }
New-Item -ItemType Directory -Force $avdRuntime | Out-Null
$avdTemp = Join-Path $avdRuntime ('node-download-' + [guid]::NewGuid())
New-Item -ItemType Directory $avdTemp | Out-Null
try {
  $avdZip = Join-Path $avdTemp $avdArchive
  Invoke-WebRequest "https://nodejs.org/dist/v22.23.2/$avdArchive" -OutFile $avdZip -UseBasicParsing -TimeoutSec 600
  if ((Get-FileHash $avdZip -Algorithm SHA256).Hash.ToLower() -ne $avdExpected) { throw 'Node checksum mismatch; archive will not run.' }
  Expand-Archive -Path $avdZip -DestinationPath $avdTemp
  $avdDestination = Join-Path $avdRuntime $avdName
  if (Test-Path $avdDestination) { throw 'Existing managed Node directory preserved; Agent must inspect before repair.' }
  Move-Item (Join-Path $avdTemp $avdName) $avdDestination
  & (Join-Path $avdDestination 'node.exe') (Join-Path $PSScriptRoot 'setup.mjs') @avdArgs
  $avdResult = $LASTEXITCODE
} finally { Remove-Item -Recurse -Force $avdTemp }
exit $avdResult
