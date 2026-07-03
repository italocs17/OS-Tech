$ErrorActionPreference = "Stop"

$projectDir = "C:\Users\Italo\Documents\Projetos IA\OS.Tech"
$electronDir = Join-Path $projectDir "electron"
$outputDir = Join-Path $projectDir "release\OS.Tech-win32-x64"
$appDir = Join-Path $outputDir "resources\app"

Write-Host "=== OS.Tech Portable Packager ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se electron.exe existe
$electronExe = Join-Path $electronDir "electron.exe"
if (-not (Test-Path $electronExe)) {
    Write-Host "ERRO: electron.exe nao encontrado em $electronDir" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] electron.exe encontrado" -ForegroundColor Green

# Verificar se dist existe
$distDir = Join-Path $projectDir "dist"
if (-not (Test-Path $distDir)) {
    Write-Host "ERRO: pasta dist nao encontrada. Execute 'npm run build' primeiro." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] pasta dist encontrada" -ForegroundColor Green

# Criar estrutura de diretorios
Write-Host ""
Write-Host "Criando estrutura de diretorios..." -ForegroundColor Yellow
$dirs = @(
    $appDir,
    (Join-Path $appDir "dist\main"),
    (Join-Path $appDir "dist\preload"),
    (Join-Path $appDir "dist\renderer"),
    (Join-Path $appDir "resources\scripts"),
    (Join-Path $appDir "resources\prisma"),
    (Join-Path $appDir "resources\icons"),
    (Join-Path $outputDir "resources\app.asar"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
}
Write-Host "[OK] Diretorios criados" -ForegroundColor Green

# Copiar electron
Write-Host ""
Write-Host "Copiando Electron..." -ForegroundColor Yellow
Copy-Item -Path $electronDir\* -Destination $outputDir -Recurse -Force
Write-Host "[OK] Electron copiado" -ForegroundColor Green

# Copiar package.json
Write-Host ""
Write-Host "Copiando package.json..." -ForegroundColor Yellow
Copy-Item -Path (Join-Path $projectDir "package.json") -Destination $appDir -Force
Write-Host "[OK] package.json copiado" -ForegroundColor Green

# Copiar dist
Write-Host ""
Write-Host "Copiando dist..." -ForegroundColor Yellow
Copy-Item -Path (Join-Path $distDir "main\*") -Destination (Join-Path $appDir "dist\main") -Force
Copy-Item -Path (Join-Path $distDir "preload\*") -Destination (Join-Path $appDir "dist\preload") -Force
Copy-Item -Path (Join-Path $distDir "renderer\*") -Destination (Join-Path $appDir "dist\renderer") -Recurse -Force
Write-Host "[OK] dist copiado" -ForegroundColor Green

# Copiar scripts
Write-Host ""
Write-Host "Copiando scripts..." -ForegroundColor Yellow
$scriptsDir = Join-Path $projectDir "scripts"
if (Test-Path $scriptsDir) {
    Copy-Item -Path (Join-Path $scriptsDir "inventory.ps1") -Destination (Join-Path $appDir "resources\scripts") -Force
}
Write-Host "[OK] scripts copiados" -ForegroundColor Green

# Copiar prisma schema
Write-Host ""
Write-Host "Copiando prisma..." -ForegroundColor Yellow
$prismaDir = Join-Path $projectDir "prisma"
if (Test-Path $prismaDir) {
    Copy-Item -Path (Join-Path $prismaDir "schema.prisma") -Destination (Join-Path $appDir "resources\prisma") -Force
    # Copiar migrations se existirem
    $migrationsDir = Join-Path $prismaDir "migrations"
    if (Test-Path $migrationsDir) {
        Copy-Item -Path $migrationsDir -Destination (Join-Path $appDir "resources\prisma\migrations") -Recurse -Force
    }
}
Write-Host "[OK] prisma copiado" -ForegroundColor Green

# Copiar icone
Write-Host ""
Write-Host "Copiando icone..." -ForegroundColor Yellow
$iconSrc = Join-Path $projectDir "resources\icons\icon.ico"
$iconDst = Join-Path $appDir "resources\icons\icon.ico"
if (Test-Path $iconSrc) {
    Copy-Item -Path $iconSrc -Destination $iconDst -Force
    Write-Host "[OK] icone copiado" -ForegroundColor Green
} else {
    Write-Host "[AVISO] icon.ico nao encontrado" -ForegroundColor Yellow
}

# Criar arquivo electron-builder.json para configurar o nome
Write-Host ""
Write-Host "Criando configuracao..." -ForegroundColor Yellow
$config = @{
    name = "OS.Tech"
    productName = "OS.Tech"
    appId = "com.ostech.app"
    version = "1.0.0"
    main = "dist/main/index.js"
} | ConvertTo-Json
$config | Out-File -FilePath (Join-Path $appDir "package.json") -Encoding UTF8
Write-Host "[OK] Configuracao criada" -ForegroundColor Green

# Verificar estrutura final
Write-Host ""
Write-Host "=== Estrutura final ===" -ForegroundColor Cyan
$exePath = Join-Path $outputDir "electron.exe"
if (Test-Path $exePath) {
    Write-Host "[OK] $exePath" -ForegroundColor Green
} else {
    Write-Host "[ERRO] electron.exe nao encontrado em $outputDir" -ForegroundColor Red
}

$appPackage = Join-Path $appDir "package.json"
if (Test-Path $appPackage) {
    Write-Host "[OK] $appPackage" -ForegroundColor Green
}

$mainJs = Join-Path $appDir "dist\main\index.js"
if (Test-Path $mainJs) {
    Write-Host "[OK] $mainJs" -ForegroundColor Green
}

$preloadJs = Join-Path $appDir "dist\preload\index.js"
if (Test-Path $preloadJs) {
    Write-Host "[OK] $preloadJs" -ForegroundColor Green
}

$rendererHtml = Join-Path $appDir "dist\renderer\index.html"
if (Test-Path $rendererHtml) {
    Write-Host "[OK] $rendererHtml" -ForegroundColor Green
}

$inventoryScript = Join-Path $appDir "resources\scripts\inventory.ps1"
if (Test-Path $inventoryScript) {
    Write-Host "[OK] $inventoryScript" -ForegroundColor Green
}

$prismaSchema = Join-Path $appDir "resources\prisma\schema.prisma"
if (Test-Path $prismaSchema) {
    Write-Host "[OK] $prismaSchema" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Pacote criado com sucesso! ===" -ForegroundColor Green
Write-Host "Para executar, rode: $exePath" -ForegroundColor Cyan
