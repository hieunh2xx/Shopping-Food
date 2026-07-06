# Kiem tra nhanh: API, ngrok, HMAC webhook
param(
    [string]$ApiBase = "http://localhost:5091",
    [string]$WebhookSecret = "whsec_J46M6ZTkZ60wmbyrgLEXbRDhGXxGnU5A"
)

Write-Host "=== 1. API diagnostics ===" -ForegroundColor Cyan
try {
    $diag = Invoke-RestMethod -Uri "$ApiBase/api/Payment/sepay/webhook/diagnostics" -TimeoutSec 5
    $diag | ConvertTo-Json
    if ($diag.authMode -eq "none") {
        Write-Host "CANH BAO: API chua load WebhookSecret - can restart API!" -ForegroundColor Red
    }
} catch {
    Write-Host "API khong chay tai $ApiBase" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== 2. HMAC bat buoc? (POST khong chu ky -> phai 401) ===" -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri "$ApiBase/api/Payment/sepay/webhook" -Method POST `
        -Body '{"id":1,"transferType":"in"}' -ContentType "application/json" -UseBasicParsing | Out-Null
    Write-Host "LOI: Webhook chap nhan request khong HMAC - restart API sau khi sua appsettings" -ForegroundColor Red
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 401) { Write-Host "OK: HMAC dang bat (401 khi thieu chu ky)" -ForegroundColor Green }
    else { Write-Host "Status: $code" -ForegroundColor Yellow }
}

Write-Host ""
Write-Host "=== 3. Ngrok ===" -ForegroundColor Cyan
try {
    $tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 3
    $https = ($tunnels.tunnels | Where-Object { $_.public_url -match "^https://" } | Select-Object -First 1).public_url
    if ($https) {
        Write-Host "Ngrok: $https"
        Write-Host "Webhook URL cho SePay: $https/api/Payment/sepay/webhook"
    } else { Write-Host "Ngrok chua co tunnel HTTPS" -ForegroundColor Yellow }
} catch {
    Write-Host "Ngrok khong chay - chay: .\scripts\start-ngrok-webhook.ps1" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== 4. Ngrok request log (SePay da POST chua?) ===" -ForegroundColor Cyan
try {
    $reqs = (Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/requests/http?limit=20").requests
    $posts = $reqs | Where-Object { $_.request.method -eq "POST" -and $_.request.uri -match "sepay/webhook" }
    if ($posts.Count -eq 0) {
        Write-Host "Chua co POST webhook nao qua ngrok (ngoai test thu cong)." -ForegroundColor Yellow
        Write-Host "=> SePay CHUA gui webhook. Kiem tra:" -ForegroundColor Yellow
        Write-Host "   - Giao dich da len my.sepay.vn -> Giao dich chua?"
        Write-Host "   - Tab TAI KHOAN cua webhook da chon VietinBank 106887005963?"
        Write-Host "   - CK vao dung TK, noi dung co SEVQR SFxxxxxxxx?"
        Write-Host "   - Xem Nhat ky WEBHOOK (khong phai IPN)"
    } else {
        foreach ($p in $posts) {
            Write-Host "$($p.start) POST -> $($p.response.status)"
        }
    }
} catch { }

Write-Host ""
Write-Host "=== 5. Test webhook co HMAC ===" -ForegroundColor Cyan
& "$PSScriptRoot\test-sepay-webhook.ps1" -BaseUrl $ApiBase -Invoice SFTEST1234 -Amount 3000 -WebhookSecret $WebhookSecret
