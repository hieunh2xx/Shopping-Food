# Gửi webhook giả lập SePay (HMAC-SHA256 hoặc không xác thực)
param(
    [string]$BaseUrl = "http://localhost:5091",
    [string]$Invoice = "SF1A2B3C4D",
    [decimal]$Amount = 50000,
    [string]$WebhookApiKey = "",
    [string]$WebhookSecret = ""
)

$transferContent = "SEVQR $Invoice"
$bodyObj = [ordered]@{
    id              = [int](Get-Random -Minimum 100000 -Maximum 999999)
    gateway         = "VietinBank"
    transactionDate = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    accountNumber   = "106887005963"
    subAccount      = $null
    code            = $Invoice
    content         = "$transferContent chuyen tien"
    transferType    = "in"
    description     = "TEST webhook ShoppingFood"
    transferAmount  = [int]$Amount
    accumulated     = 0
    referenceCode   = "FT-TEST-$(Get-Random)"
}
$body = $bodyObj | ConvertTo-Json -Compress

$headers = @{ "Content-Type" = "application/json; charset=utf-8" }

if ($WebhookApiKey) {
    $headers["Authorization"] = "Apikey $WebhookApiKey"
}
elseif ($WebhookSecret) {
    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = [Text.Encoding]::UTF8.GetBytes($WebhookSecret)
    $payload = "$timestamp.$body"
    $hashBytes = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($payload))
    $hex = -join ($hashBytes | ForEach-Object { $_.ToString("x2") })
    $headers["X-SePay-Signature"] = "sha256=$hex"
    $headers["X-SePay-Timestamp"] = $timestamp
    Write-Host "HMAC: sha256=$hex (ts=$timestamp)"
}

Write-Host "POST $BaseUrl/api/Payment/sepay/webhook"
Write-Host "Body: $body"

try {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/Payment/sepay/webhook" `
        -Method POST -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -Headers $headers
    Write-Host "OK:" ($res | ConvertTo-Json -Compress)
} catch {
    Write-Host "FAILED:" $_.Exception.Message
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
    exit 1
}
