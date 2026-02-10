$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverPath = Join-Path $repoRoot "dlsm-temp\dlsm-inv-sys-client-main\services\edge-server"
Set-Location $serverPath

$env:NO_DB = "1"

# Load .env values into process env
$envPath = Join-Path $serverPath ".env"
if (Test-Path $envPath) {
	Get-Content $envPath | ForEach-Object {
		$line = $_.Trim()
		if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
			$parts = $line.Split("=", 2)
			$name = $parts[0].Trim()
			$value = $parts[1]
			if ($name) {
				Set-Item -Path "Env:$name" -Value $value
			}
		}
	}
}

Write-Host "Starting backend server..."
Write-Host "URL: http://localhost:8080/"

node src/server.mjs
