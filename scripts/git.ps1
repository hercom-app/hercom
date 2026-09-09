# Git helper: usa Git del sistema/PATH; si no hay, cae a PortableGit del repo.
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

$git = $null
$fromPath = Get-Command git -ErrorAction SilentlyContinue
if ($fromPath) {
  $git = $fromPath.Source
} else {
  $userGit = Join-Path $env:LOCALAPPDATA "Programs\Git\cmd\git.exe"
  $repoGit = Join-Path $root ".tools\PortableGit\cmd\git.exe"
  if (Test-Path $userGit) {
    $git = $userGit
  } elseif (Test-Path $repoGit) {
    $git = $repoGit
  }
}

if (-not $git) {
  Write-Error "Git no encontrado. Ejecutá: powershell -ExecutionPolicy Bypass -File .\scripts\install-dev-tools.ps1"
}

Set-Location $root
& $git @args
