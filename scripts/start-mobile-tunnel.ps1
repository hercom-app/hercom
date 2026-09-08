# Hercom — Expo Go con túnel clásico (exp.direct)
# En esta PC: libera 8081 antes de arrancar; --clear hace fallar el túnel (timeout 10s).

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$nodeDir = Join-Path $root ".tools\nodejs"
$env:Path = "$nodeDir;" + $env:Path
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
