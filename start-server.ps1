$ErrorActionPreference = "Stop"

$serverPath = "c:\Users\joshu\OneDrive\Desktop\test\dlsm-temp\dlsm-inv-sys-client-main"
Set-Location $serverPath

Write-Host "Starting mock backend server..."
Write-Host "URL: http://localhost:8080/"

node dev-server/server.mjs
