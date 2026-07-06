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

# --- Đã có tunnel tới đúng port?
$existing = Get-ActiveNgrokUrl -TargetPort $Port
if ($existing -and -not $Restart) {
    Write-Host "Ngrok da chay san (port $Port). Khong can khoi dong lai." -ForegroundColor Yellow
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
Write-Host "Ngrok PID: $($ngrokJob.Id) - de dung: Stop-Process -Id $($ngrokJob.Id)" -ForegroundColor DarkGray
