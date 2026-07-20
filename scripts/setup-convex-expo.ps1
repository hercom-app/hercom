# Setup Convex + Expo desde cero (Hercom)
# Ejecutar desde la raíz del proyecto en PowerShell:
#   .\scripts\setup-convex-expo.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "`n=== PASO 1: Login en Convex ===" -ForegroundColor Cyan
Write-Host "Se abrirá el navegador. Inicia sesión con hercom.desarrollo@gmail.com`n"
Set-Location "$root\packages\backend"
npx convex login
if ($LASTEXITCODE -ne 0) { throw "Login de Convex falló" }

Write-Host "`n=== PASO 2: Crear proyecto Convex ===" -ForegroundColor Cyan
Write-Host "Cuando pregunte, elige crear proyecto NUEVO llamado 'hercom'`n"
npx convex dev --once --configure new
if ($LASTEXITCODE -ne 0) { throw "convex dev falló" }

# Leer la URL del deployment
$envContent = Get-Content ".env.local" -Raw
if ($envContent -match "CONVEX_URL=(https://[^\s]+)") {
    $convexUrl = $Matches[1]
    Write-Host "Convex URL detectada: $convexUrl" -ForegroundColor Green
} else {
    throw "No se encontró CONVEX_URL en .env.local"
}

Write-Host "`n=== PASO 3: Activar Convex Auth (JWT) ===" -ForegroundColor Cyan
npx @convex-dev/auth
if ($LASTEXITCODE -ne 0) { throw "convex auth falló" }

Write-Host "`n=== PASO 4: Cargar datos demo ===" -ForegroundColor Cyan
npx convex run seed:seedDemo
if ($LASTEXITCODE -ne 0) { throw "seed falló" }

Write-Host "`n=== PASO 5: Generar tipos (_generated) ===" -ForegroundColor Cyan
npx convex codegen
if ($LASTEXITCODE -ne 0) { throw "codegen falló" }

Write-Host "`n=== PASO 6: Crear .env de apps ===" -ForegroundColor Cyan
"EXPO_PUBLIC_CONVEX_URL=$convexUrl" | Out-File -Encoding utf8 "$root\apps\mobile\.env"
"VITE_CONVEX_URL=$convexUrl" | Out-File -Encoding utf8 "$root\apps\web-admin\.env.local"
Write-Host "Creados apps/mobile/.env y apps/web-admin/.env.local" -ForegroundColor Green

# Actualizar eas.json con la nueva URL
$easJsonPath = "$root\apps\mobile\eas.json"
$easJson = Get-Content $easJsonPath -Raw
$easJson = $easJson -replace "https://[a-z]+-[a-z]+-\d+\.convex\.cloud", $convexUrl
$easJson | Out-File -Encoding utf8 $easJsonPath
Write-Host "Actualizado apps/mobile/eas.json" -ForegroundColor Green

Write-Host "`n=== PASO 7: Login en Expo ===" -ForegroundColor Cyan
Write-Host "Inicia sesión con hercom.desarrollo@gmail.com`n"
Set-Location "$root\apps\mobile"
npx eas-cli logout 2>$null
npx eas-cli login
if ($LASTEXITCODE -ne 0) { throw "Login de Expo falló" }

Write-Host "`n=== PASO 8: Vincular proyecto EAS ===" -ForegroundColor Cyan
npx eas-cli init --force
if ($LASTEXITCODE -ne 0) { throw "eas init falló" }

Write-Host "`n=== PASO 9 (opcional): Deploy producción ===" -ForegroundColor Cyan
Write-Host "Para producción, ejecuta manualmente:"
Write-Host "  cd packages/backend"
Write-Host "  npx convex deploy"
Write-Host "  npx @convex-dev/auth --prod"
Write-Host "  npx convex run seed:seedDemo --prod"
Write-Host "Luego actualiza VITE_CONVEX_URL en Vercel con la URL de prod.`n"

Write-Host "=== SETUP COMPLETADO ===" -ForegroundColor Green
Write-Host "Convex URL (dev): $convexUrl"
Write-Host "Cuentas demo: admin@demo.com / chofer@demo.com / demo1234"
Write-Host "Probar mobile: pnpm mobile"
Write-Host "Probar admin:  pnpm web:admin`n"
