# Verifica que este PC este listo y conectado al Convex de Hercom.
# Uso (cualquier terminal nueva, sin declarar PATH):
#   powershell -ExecutionPolicy Bypass -File .\scripts\verify-convex.ps1

$ErrorActionPreference = "Continue"
$root = Split-Path $PSScriptRoot -Parent

# Asegurar PATH de herramientas de usuario (por si la terminal se abrio antes del install)
$nodeBin = Join-Path $env:LOCALAPPDATA "Programs\nodejs"
$gitCmd = Join-Path $env:LOCALAPPDATA "Programs\Git\cmd"
$gitUsr = Join-Path $env:LOCALAPPDATA "Programs\Git\usr\bin"
foreach ($p in @($nodeBin, $gitCmd, $gitUsr)) {
  if ((Test-Path $p) -and (($env:Path -split ";") -notcontains $p)) {
    $env:Path = "$p;" + $env:Path
  }
}

function Ok($msg) { Write-Host "  OK  $msg" -ForegroundColor Green }
function Bad($msg) { Write-Host "  FAIL $msg" -ForegroundColor Red }
function Info($msg) { Write-Host "  --  $msg" -ForegroundColor DarkGray }

Write-Host ""
Write-Host "=== 1) Herramientas del sistema ===" -ForegroundColor Cyan
$toolsOk = $true
foreach ($name in @("node", "npm", "git", "pnpm")) {
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  if ($cmd) {
    $ver = & $name --version 2>$null
    if (-not $ver) { $ver = & $name -v 2>$null }
    Ok ("{0} -> {1} ({2})" -f $name, $cmd.Source, ($ver -join " "))
  } else {
    Bad "$name no esta en PATH"
    $toolsOk = $false
  }
}

Write-Host ""
Write-Host "=== 2) URLs Convex en el repo ===" -ForegroundColor Cyan
$expected = "https://lovable-kudu-343.convex.cloud"
$mobileEnv = Join-Path $root "apps\mobile\.env"
$adminEnv = Join-Path $root "apps\web-admin\.env.local"
$backendEnv = Join-Path $root "packages\backend\.env.local"
$easJson = Join-Path $root "apps\mobile\eas.json"

$urls = @{}
if (Test-Path $mobileEnv) {
  $m = Select-String -Path $mobileEnv -Pattern "EXPO_PUBLIC_CONVEX_URL=(.+)" | Select-Object -First 1
  if ($m) { $urls["mobile (.env)"] = $m.Matches[0].Groups[1].Value.Trim() }
} else {
  Bad "Falta apps/mobile/.env"
}

if (Test-Path $adminEnv) {
  $m = Select-String -Path $adminEnv -Pattern "VITE_CONVEX_URL=(.+)" | Select-Object -First 1
  if ($m) { $urls["web-admin (.env.local)"] = $m.Matches[0].Groups[1].Value.Trim() }
} else {
  Bad "Falta apps/web-admin/.env.local"
}

if (Test-Path $backendEnv) {
  $raw = Get-Content $backendEnv -Raw
  if ($raw -match "CONVEX_URL=(https://[^\s]+)") {
    $urls["backend (.env.local)"] = $Matches[1].Trim()
  } elseif ($raw -match "CONVEX_DEPLOYMENT=([^\s]+)") {
    Info ("backend tiene CONVEX_DEPLOYMENT={0} (sin CONVEX_URL aun)" -f $Matches[1].Trim())
  }
} else {
  Info "Sin packages/backend/.env.local - normal si solo usas el deployment en la nube sin convex dev"
}

if (Test-Path $easJson) {
  $eas = Get-Content $easJson -Raw
  if ($eas -match "https://[a-z0-9-]+\.convex\.cloud") {
    $urls["eas.json (preview)"] = $Matches[0]
  }
}

$convexUrl = $null
foreach ($kv in $urls.GetEnumerator()) {
  Write-Host ("  {0}: {1}" -f $kv.Key, $kv.Value)
  if (-not $convexUrl) { $convexUrl = $kv.Value }
  if ($kv.Value -ne $expected -and $kv.Value -notmatch "\.convex\.cloud$") {
    Bad ("URL rara en {0}" -f $kv.Key)
  }
}

if (-not $convexUrl) {
  Bad "No se encontro ninguna URL Convex en el repo"
  exit 1
}

Write-Host ""
Write-Host "=== 3) Conectividad HTTP al deployment ===" -ForegroundColor Cyan
try {
  $resp = & C:\Windows\System32\curl.exe -sS -o NUL -w "%{http_code}" --connect-timeout 15 $convexUrl
  if ($resp -match "^\d+$" -and [int]$resp -ge 200 -and [int]$resp -lt 500) {
    Ok ("HTTP {0} desde {1}" -f $resp, $convexUrl)
  } else {
    Bad ("Respuesta inesperada: {0}" -f $resp)
  }
} catch {
  Bad ("No se pudo alcanzar {0} - {1}" -f $convexUrl, $_.Exception.Message)
}

Write-Host ""
Write-Host "=== 4) CLI Convex (opcional) ===" -ForegroundColor Cyan
$backendPkg = Join-Path $root "packages\backend"
Push-Location $backendPkg
try {
  if (-not (Test-Path (Join-Path $backendPkg "node_modules\convex"))) {
    Info "Sin node_modules en backend. Corre: pnpm install (desde la raiz del repo)"
  } else {
    $who = & npx --yes convex whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
      Ok ("convex whoami: {0}" -f ($who -join " "))
    } else {
      Info "No hay sesion Convex CLI (ok si solo consumes la URL). Login: npx convex login"
      Info ($who -join " ")
    }
  }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "=== Resumen ===" -ForegroundColor Cyan
if ($toolsOk) {
  Ok "node / npm / git listos en PATH permanente (User + profile)"
} else {
  Bad "Faltan herramientas - cierra y abre una terminal nueva, o reinstala con scripts\install-dev-tools.ps1"
}
Info ("Apps del repo apuntan a: {0}" -f $convexUrl)
Info "Dashboard: https://dashboard.convex.dev -> deployment lovable-kudu-343 (produccion)"
Info "Admin Vercel debe usar la MISMA URL (VITE_CONVEX_URL). Un solo ambiente hasta Play Store."
Write-Host ""
