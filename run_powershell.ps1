# =====================================================================
# NilaMart C++20 Drogon E-Commerce - Windows PowerShell Setup & Run
# =====================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  NilaMart C++20 Drogon E-Commerce Platform Build Script  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check prerequisites
$vcpkgRoot = $env:VCPKG_ROOT
if (-not $vcpkgRoot) {
    Write-Host "[INFO] VCPKG_ROOT environment variable not found. Using default C:\vcpkg" -ForegroundColor Yellow
    $vcpkgRoot = "C:\vcpkg"
}

Write-Host "[1/5] Checking CMake and Compiler..." -ForegroundColor Green
cmake --version

# 2. Setup PostgreSQL Database
Write-Host "[2/5] Initializing PostgreSQL Database 'nilamart'..." -ForegroundColor Green
try {
    psql -U postgres -c "CREATE DATABASE nilamart;" 2>$null
    psql -U postgres -d nilamart -f database/schema.sql
    psql -U postgres -d nilamart -f database/seed.sql
    Write-Host "PostgreSQL database initialized and seeded successfully!" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Make sure PostgreSQL service is running and psql is in your PATH." -ForegroundColor Yellow
}

# 3. Create build directory
Write-Host "[3/5] Configuring CMake with C++20 standard..." -ForegroundColor Green
if (-not (Test-Path -Path "build")) {
    New-Item -ItemType Directory -Path "build" | Out-Null
}

cd build

# 4. Run CMake configure & build
if (Test-Path "$vcpkgRoot\scripts\buildsystems\vcpkg.cmake") {
    cmake .. -DCMAKE_TOOLCHAIN_FILE="$vcpkgRoot\scripts\buildsystems\vcpkg.cmake" -DCMAKE_BUILD_TYPE=Release
} else {
    cmake .. -DCMAKE_BUILD_TYPE=Release
}

Write-Host "[4/5] Compiling C++20 Drogon Backend..." -ForegroundColor Green
cmake --build . --config Release --parallel

# 5. Run Server
Write-Host "[5/5] Launching NilaMart Server on http://localhost:8080..." -ForegroundColor Green
if (Test-Path "Release\nilamart_server.exe") {
    .\Release\nilamart_server.exe
} elseif (Test-Path ".\nilamart_server.exe") {
    .\nilamart_server.exe
} else {
    Write-Host "[ERROR] Binary not found. Check CMake compilation logs." -ForegroundColor Red
}
