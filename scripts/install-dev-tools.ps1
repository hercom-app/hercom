# Instala Node.js LTS + Git + pnpm en el perfil de usuario (sin admin).
# Deja PATH permanente: no hace falta redeclarar el entorno en cada terminal.
# Uso:
#   powershell -ExecutionPolicy Bypass -File .\scripts\install-dev-tools.ps1

$ErrorActionPreference = "Stop"
$destRoot = Join-Path $env:LOCALAPPDATA "Programs"
$nodeVersion = "v22.19.0"
$nodeZipName = "node-$nodeVersion-win-x64.zip"
$nodeUrl = "https://nodejs.org/dist/$nodeVersion/$nodeZipName"
$gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.1/PortableGit-2.47.1-64-bit.7z.exe"

$nodeZip = Join-Path $env:TEMP $nodeZipName
$gitSelf = Join-Path $env:TEMP "PortableGit.7z.exe"
$nodeDest = Join-Path $destRoot "nodejs"
$gitDest = Join-Path $destRoot "Git"

New-Item -ItemType Directory -Force -Path $destRoot | Out-Null

Write-Host "Descargando Node $nodeVersion..." -ForegroundColor Cyan
& C:\Windows\System32\curl.exe -L --retry 3 --connect-timeout 30 -o $nodeZip $nodeUrl
if (-not (Test-Path $nodeZip) -or (Get-Item $nodeZip).Length -lt 1MB) {
  throw "Descarga de Node falló"
}

Write-Host "Extrayendo Node..." -ForegroundColor Cyan
if (Test-Path $nodeDest) { Remove-Item -Recurse -Force $nodeDest }
Expand-Archive -Path $nodeZip -DestinationPath $destRoot -Force
$extracted = Join-Path $destRoot "node-$nodeVersion-win-x64"
if (Test-Path $extracted) { Rename-Item $extracted "nodejs" }

Write-Host "Descargando PortableGit..." -ForegroundColor Cyan
& C:\Windows\System32\curl.exe -L --retry 3 --connect-timeout 30 -o $gitSelf $gitUrl
if (-not (Test-Path $gitSelf) -or (Get-Item $gitSelf).Length -lt 1MB) {
  throw "Descarga de Git falló"
}

Write-Host "Extrayendo Git..." -ForegroundColor Cyan
if (Test-Path $gitDest) { Remove-Item -Recurse -Force $gitDest }
New-Item -ItemType Directory -Force -Path $gitDest | Out-Null
$p = Start-Process -FilePath $gitSelf -ArgumentList @("-o`"$gitDest`"", "-y") -Wait -PassThru -NoNewWindow
if ($p.ExitCode -ne 0) { throw "Extracción de Git falló (exit $($p.ExitCode))" }

$gitExe = Join-Path $gitDest "cmd\git.exe"
if (-not (Test-Path $gitExe)) { throw "No se encontró $gitExe" }

# PATH permanente (User)
$nodeBin = $nodeDest
$gitCmd = Join-Path $gitDest "cmd"
$gitUsrBin = Join-Path $gitDest "usr\bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$parts = @()
if ($userPath) {
  $parts = $userPath -split ";" | Where-Object { $_ -and $_.Trim() -ne "" }
}
foreach ($add in @($nodeBin, $gitCmd, $gitUsrBin)) {
  if ($parts -notcontains $add) { $parts += $add }
}
$parts = $parts | Where-Object { $_ -notmatch "\\hercom\\\.tools\\" }
[Environment]::SetEnvironmentVariable("Path", ($parts -join ";"), "User")
$env:Path = "$nodeBin;$gitCmd;$gitUsrBin;" + $env:Path

Write-Host "Instalando pnpm@9..." -ForegroundColor Cyan
& (Join-Path $nodeBin "npm.cmd") install -g pnpm@9

# Profile (refuerzo para terminales que no refrescan User PATH)
$profileDir = Split-Path $PROFILE -Parent
if (-not (Test-Path $profileDir)) { New-Item -ItemType Directory -Force -Path $profileDir | Out-Null }
$snippet = @'
# Hercom / tools PATH (User-level installs; no per-terminal setup)
$__node = Join-Path $env:LOCALAPPDATA "Programs\nodejs"
$__gitCmd = Join-Path $env:LOCALAPPDATA "Programs\Git\cmd"
$__gitUsr = Join-Path $env:LOCALAPPDATA "Programs\Git\usr\bin"
foreach ($__p in @($__node, $__gitCmd, $__gitUsr)) {
  if ((Test-Path $__p) -and (($env:Path -split ";") -notcontains $__p)) {
    $env:Path = "$__p;" + $env:Path
  }
}
Remove-Variable __node, __gitCmd, __gitUsr, __p -ErrorAction SilentlyContinue
'@
if (-not (Test-Path $PROFILE)) {
  Set-Content -Path $PROFILE -Value $snippet -Encoding UTF8
} elseif ((Get-Content $PROFILE -Raw) -notmatch "Programs\\nodejs") {
  Add-Content -Path $PROFILE -Value "`n$snippet"
}

Write-Host "`nListo. Verificá:" -ForegroundColor Green
Write-Host "  node -v   → $(& (Join-Path $nodeBin 'node.exe') -v)"
Write-Host "  npm -v    → $(& (Join-Path $nodeBin 'npm.cmd') -v)"
Write-Host "  git --version → $(& $gitExe --version)"
Write-Host "  pnpm -v   → $(& (Join-Path $nodeBin 'pnpm.cmd') -v)"
Write-Host "`nCerrá y abrí Cursor/terminal para que el PATH quede activo en todas partes."
Write-Host "Luego: powershell -ExecutionPolicy Bypass -File .\scripts\verify-convex.ps1"
