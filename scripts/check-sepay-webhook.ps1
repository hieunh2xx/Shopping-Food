# Kiem tra va test webhook SePay (local + ngrok + don pending)
param(
    [string]$ApiBase = "http://localhost:5091",
    [string]$ProjectRoot = (Split-Path $PSScriptRoot -Parent)
)

$appsettingsPath = Join-Path $ProjectRoot "src\ShoppingFood.API\appsettings.Development.json"
$secret = ""
if (Test-Path $appsettingsPath) {
    $cfg = Get-Content $appsettingsPath -Raw | ConvertFrom-Json
    $secret = $cfg.Sepay.WebhookSecret
}

Write-Host "=== 1. API diagnostics ===" -ForegroundColor Cyan
try {
    $diag = Invoke-RestMethod -Uri "$ApiBase/api/Payment/sepay/webhook/diagnostics" -TimeoutSec 8
    $diag | ConvertTo-Json -Depth 5
    if ($diag.authMode -eq "none") {
        Write-Host "CANH BAO: WebhookSecret chua load - restart API!" -ForegroundColor Red
    }
} catch {
    Write-Host "API khong chay tai $ApiBase - chay: dotnet run --project src/ShoppingFood.API" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== 2. HMAC (POST khong chu ky -> 401) ===" -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri "$ApiBase/api/Payment/sepay/webhook" -Method POST `
        -Body '{"id":1,"transferType":"in"}' -ContentType "application/json" -UseBasicParsing | Out-Null
    Write-Host "LOI: chap nhan request khong HMAC" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "OK: HMAC dang bat" -ForegroundColor Green
    } else {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== 3. Ngrok ===" -ForegroundColor Cyan
$ngrokUrl = $null
try {
    $tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 3
    $ngrokUrl = ($tunnels.tunnels | Where-Object { $_.public_url -match "^https://" } | Select-Object -First 1).public_url
    if ($ngrokUrl) {
        Write-Host "Ngrok: $ngrokUrl"
        Write-Host "URL dan cho SePay: $ngrokUrl/api/Payment/sepay/webhook"
    }
} catch {
    Write-Host "Ngrok khong chay - chay: .\scripts\start-ngrok-webhook.ps1" -ForegroundColor Yellow
}

if (-not $secret) {
    Write-Host "Khong doc duoc WebhookSecret tu appsettings" -ForegroundColor Red
    exit 1
}

function Send-SepayWebhook {
    param([string]$BaseUrl, [string]$Invoice, [decimal]$Amount)
    $bodyObj = [ordered]@{
        id              = [int](Get-Random -Minimum 100000 -Maximum 999999)
        gateway         = "VietinBank"
        transactionDate = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        accountNumber   = "106887005963"
        code            = $Invoice
        content         = "SEVQR $Invoice chuyen tien"
        transferType    = "in"
        transferAmount  = [int]$Amount
        referenceCode   = "FT-TEST-$(Get-Random)"
    }
    $body = $bodyObj | ConvertTo-Json -Compress
    $ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = [Text.Encoding]::UTF8.GetBytes($secret)
    $hex = -join ($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes("$ts.$body")) | ForEach-Object { $_.ToString("x2") })
    $headers = @{
        "Content-Type"         = "application/json; charset=utf-8"
        "X-SePay-Signature"    = "sha256=$hex"
        "X-SePay-Timestamp"    = $ts
        "ngrok-skip-browser-warning" = "true"
    }
    Write-Host "POST $BaseUrl/api/Payment/sepay/webhook invoice=$Invoice amount=$Amount"
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/Payment/sepay/webhook" -Method POST `
        -Body ([Text.Encoding]::UTF8.GetBytes($body)) -Headers $headers
    $res | ConvertTo-Json -Compress
}

Write-Host ""
Write-Host "=== 4. Test local webhook ===" -ForegroundColor Cyan
$testInvoice = "SFTEST1234"
$testAmount = 3000
if ($diag.pendingSepaySessions -and $diag.pendingSepaySessions.Count -gt 0) {
    $p = $diag.pendingSepaySessions[0]
    $testInvoice = $p.invoiceNumber
    $testAmount = [decimal]$p.amount
    Write-Host "Dung don pending: $testInvoice / $testAmount" -ForegroundColor Green
}
try {
    Send-SepayWebhook -BaseUrl $ApiBase -Invoice $testInvoice -Amount $testAmount
    Start-Sleep -Seconds 2
    $st = Invoke-RestMethod -Uri "$ApiBase/api/Payment/sepay/session/status?invoiceNumber=$testInvoice"
    Write-Host "Trang thai sau webhook: isPaid=$($st.data.isPaid) status=$($st.data.status)"
} catch {
    Write-Host "FAILED local:" $_.Exception.Message -ForegroundColor Red
}

if ($ngrokUrl) {
    Write-Host ""
    Write-Host "=== 5. Test ngrok webhook ===" -ForegroundColor Cyan
    try {
        Send-SepayWebhook -BaseUrl $ngrokUrl -Invoice $testInvoice -Amount $testAmount
    } catch {
        Write-Host "FAILED ngrok:" $_.Exception.Message -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "=== 6. Ngrok POST log ===" -ForegroundColor Cyan
    $reqs = (Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/requests/http?limit=10").requests
    $reqs | Where-Object { $_.request.uri -match "sepay/webhook" } | ForEach-Object {
        Write-Host "$($_.start) $($_.request.method) -> $($_.response.status)"
    }
}

Write-Host ""
Write-Host "Neu SePay dashboard van trong: CK that + tab Tai khoan webhook chon VietinBank 106887005963" -ForegroundColor Yellow
