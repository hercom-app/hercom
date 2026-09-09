# Hercom — Expo Go con túnel clásico (exp.direct)
# En esta PC: libera 8081 antes de arrancar; --clear hace fallar el túnel (timeout 10s).

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
# Prefer Node del PATH / instalación de usuario; fallback al portable del repo
$userNode = Join-Path $env:LOCALAPPDATA "Programs\nodejs"
$repoNode = Join-Path $root ".tools\nodejs"
foreach ($nodeDir in @($userNode, $repoNode)) {
  if (Test-Path (Join-Path $nodeDir "node.exe")) {
    if (($env:Path -split ";") -notcontains $nodeDir) {
      $env:Path = "$nodeDir;" + $env:Path
    }
    break
  }
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node no encontrado. Ejecutá: powershell -ExecutionPolicy Bypass -File .\scripts\install-dev-tools.ps1"
}
$env:EXPO_NO_TELEMETRY = "1"

Write-Host "Liberando puerto 8081..."
$pids = netstat -ano | Select-String "LISTENING" | Select-String ":8081" | ForEach-Object {
    ($_ -split "\s+")[-1]
} | Select-Object -Unique
foreach ($procId in $pids) {
    if ($procId -match "^\d+$") {
        taskkill /PID $procId /F 2>$null | Out-Null
    }
}
Start-Sleep -Seconds 1

Set-Location (Join-Path $root "apps\mobile")
Write-Host "Iniciando Expo con túnel (espera 'Tunnel ready' y el QR exp://....exp.direct)..."
npx expo start --tunnel --port 8081
