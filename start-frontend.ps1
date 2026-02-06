$ErrorActionPreference = "Stop"

$frontendPath = "c:\Users\joshu\OneDrive\Desktop\test\nasa-hunch"
Set-Location $frontendPath

Write-Host "Starting frontend (Vite dev server)..."
Write-Host "URL: http://localhost:5173/"

npm run dev
