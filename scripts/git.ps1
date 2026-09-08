# Git portable para este proyecto (sin instalar Git en el sistema).
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$git = Join-Path $root ".tools\PortableGit\cmd\git.exe"
if (-not (Test-Path $git)) {
    Write-Error "No se encontró PortableGit en .tools\PortableGit"
}
Set-Location $root
& $git @args
