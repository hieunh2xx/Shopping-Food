# Expose API local (port 5091) qua ngrok cho SePay webhook/IPN
# Usage:
#   .\scripts\start-ngrok-webhook.ps1           # dùng tunnel đang chạy hoặc tạo mới
#   .\scripts\start-ngrok-webhook.ps1 -Restart  # tắt ngrok cũ rồi chạy lại

param(
    [switch]$Restart,
    [int]$Port = 5091
)

$ErrorActionPreference = "Stop"
$NgrokApi = "http://127.0.0.1:4040/api/tunnels"
$UrlsFile = Join-Path $PSScriptRoot "sepay-webhook-urls.txt"

function Get-ActiveNgrokUrl {
    param([int]$TargetPort)
    try {
        $resp = Invoke-RestMethod -Uri $NgrokApi -TimeoutSec 2
        foreach ($t in $resp.tunnels) {
            $addr = $t.config.addr -replace "tcp://", "" -replace "http://", ""
            if ($addr -match ":$TargetPort$" -and $t.public_url -match "^https://") {
                return $t.public_url
            }
        }
    } catch { }
    return $null
}

function Test-ApiListening {
    param([int]$TargetPort)
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:$TargetPort/swagger/index.html" -UseBasicParsing -TimeoutSec 3
        return $resp.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Stop-NgrokProcesses {
    Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
}

function Write-WebhookInfo {
    param([string]$BaseUrl)
    $ipn = "$BaseUrl/api/Payment/sepay/ipn"
    $wh = "$BaseUrl/api/Payment/sepay/webhook"
    Write-Host ""
    Write-Host "Ngrok URL: $BaseUrl" -ForegroundColor Green
    Write-Host "  IPN:     $ipn"
    Write-Host "  Webhook: $wh"
    Write-Host "  Dashboard: http://127.0.0.1:4040" -ForegroundColor Gray
    Write-Host ""

    @"
# SePay Webhook URLs (ngrok) — auto-updated $(Get-Date -Format 'yyyy-MM-dd HH:mm')
NGROK_URL=$BaseUrl
IPN_URL=$ipn
WEBHOOK_URL=$wh
"@ | Set-Content -Path $UrlsFile -Encoding UTF8
}

# --- API phải chạy trước — ngrok 502 nếu không có upstream
if (-not (Test-ApiListening -TargetPort $Port)) {
    Write-Host "CANH BAO: API chua chay tai http://localhost:$Port" -ForegroundColor Red
    Write-Host "Ngrok se tra 502 Bad Gateway neu forward webhook khi API tat." -ForegroundColor Yellow
    Write-Host "Chay API truoc:" -ForegroundColor Yellow
    Write-Host "  cd src\ShoppingFood.API" -ForegroundColor Gray
    Write-Host "  dotnet run --launch-profile http" -ForegroundColor Gray
    Write-Host ""
}

# --- Đã có tunnel tới đúng port?
$existing = Get-ActiveNgrokUrl -TargetPort $Port
if ($existing -and -not $Restart) {
    Write-Host "Ngrok da chay san (port $Port). Khong can khoi dong lai." -ForegroundColor Yellow
    if (-not (Test-ApiListening -TargetPort $Port)) {
        Write-Host "CANH BAO: API chua chay — ngrok se tra 502." -ForegroundColor Red
    }
    Write-WebhookInfo -BaseUrl $existing
    exit 0
}

# --- Restart: tắt instance cũ (tránh ERR_NGROK_334)
if ($Restart -or $existing) {
    Write-Host "Dang tat ngrok cu..." -ForegroundColor Yellow
    Stop-NgrokProcesses
}

Write-Host "Khoi dong ngrok -> http://localhost:$Port" -ForegroundColor Cyan

# Chạy nền, đợi URL
$ngrokJob = Start-Process -FilePath "ngrok" -ArgumentList "http", $Port -PassThru -WindowStyle Hidden

$deadline = (Get-Date).AddSeconds(15)
$url = $null
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 500
    $url = Get-ActiveNgrokUrl -TargetPort $Port
    if ($url) { break }
}

if (-not $url) {
    Write-Host "Khong lay duoc URL ngrok trong 15s. Kiem tra: ngrok config add-authtoken ..." -ForegroundColor Red
    exit 1
}

Write-WebhookInfo -BaseUrl $url

if (-not (Test-ApiListening -TargetPort $Port)) {
    Write-Host "Ngrok da san sang nhung API van chua phan hoi — webhook SePay se loi 502 cho den khi API chay." -ForegroundColor Red
} else {
    Write-Host "API + Ngrok OK — webhook co the nhan request." -ForegroundColor Green
}

Write-Host "Ngrok PID: $($ngrokJob.Id) - de dung: Stop-Process -Id $($ngrokJob.Id)" -ForegroundColor DarkGray
