# ============================================================
# Expose API local (port 5091) qua ngrok cho SePay webhook/IPN
#
# Usage:
#
#   .\scripts\start-ngrok-webhook.ps1
#
#   .\scripts\start-ngrok-webhook.ps1 -Restart
#
# ============================================================

param(
    [switch]$Restart,
    [int]$Port = 5091
)

$ErrorActionPreference = "Stop"


# ============================================================
# CONFIGURATION
# ============================================================

$NgrokApi = "http://127.0.0.1:4040/api/tunnels"

$UrlsFile = Join-Path `
    $PSScriptRoot `
    "sepay-webhook-urls.txt"


# ============================================================
# FIND NGROK
# ============================================================

function Find-Ngrok {

    # --------------------------------------------------------
    # 1. Try PATH
    # --------------------------------------------------------

    $command = Get-Command `
        "ngrok" `
        -ErrorAction SilentlyContinue

    if ($command) {

        return $command.Source
    }


    # --------------------------------------------------------
    # 2. Try user's Downloads folder
    # --------------------------------------------------------

    $downloadsNgrok = Join-Path `
        $env:USERPROFILE `
        "Downloads\ngrok.exe"

    if (Test-Path $downloadsNgrok) {

        return $downloadsNgrok
    }


    # --------------------------------------------------------
    # 3. Try script/project directory
    # --------------------------------------------------------

    $projectNgrok = Join-Path `
        $PSScriptRoot `
        "ngrok.exe"

    if (Test-Path $projectNgrok) {

        return $projectNgrok
    }


    # --------------------------------------------------------
    # Not found
    # --------------------------------------------------------

    return $null
}


# ============================================================
# GET ACTIVE NGROK URL
# ============================================================

function Get-ActiveNgrokUrl {

    param(
        [int]$TargetPort
    )

    try {

        $response = Invoke-RestMethod `
            -Uri $NgrokApi `
            -TimeoutSec 2


        foreach ($tunnel in $response.tunnels) {

            $addr = $tunnel.config.addr


            if ($null -eq $addr) {

                continue
            }


            # Normalize address

            $addr = $addr `
                -replace "^tcp://", "" `
                -replace "^http://", "" `
                -replace "^https://", ""


            # Check target port

            if (
                $addr -match ":$TargetPort$" -and
                $tunnel.public_url -match "^https://"
            ) {

                return $tunnel.public_url
            }
        }
    }
    catch {

        # Ngrok dashboard chưa sẵn sàng
    }


    return $null
}


# ============================================================
# TEST API
# ============================================================

function Test-ApiListening {

    param(
        [int]$TargetPort
    )


    try {

        $swaggerUrl =
            "http://localhost:$TargetPort/swagger/index.html"


        $response = Invoke-WebRequest `
            -Uri $swaggerUrl `
            -UseBasicParsing `
            -TimeoutSec 3


        return ($response.StatusCode -eq 200)
    }
    catch {

        return $false
    }
}


# ============================================================
# STOP NGROK PROCESSES
# ============================================================

function Stop-NgrokProcesses {

    Write-Host ""
    Write-Host "Kiem tra ngrok process..." `
        -ForegroundColor Cyan


    $processes = Get-Process `
        -Name "ngrok" `
        -ErrorAction SilentlyContinue


    if ($processes) {

        foreach ($process in $processes) {

            Write-Host `
                "Dang dung ngrok PID $($process.Id)..." `
                -ForegroundColor Yellow


            Stop-Process `
                -Id $process.Id `
                -Force `
                -ErrorAction SilentlyContinue
        }


        Start-Sleep -Seconds 2


        Write-Host "Da dung ngrok cu." `
            -ForegroundColor Green
    }
    else {

        Write-Host "Khong co ngrok process dang chay." `
            -ForegroundColor Gray
    }


    Write-Host ""
}


# ============================================================
# WRITE WEBHOOK INFO
# ============================================================

function Write-WebhookInfo {

    param(
        [string]$BaseUrl
    )


    # Remove trailing slash

    $BaseUrl = $BaseUrl.TrimEnd("/")


    $ipnUrl =
        "$BaseUrl/api/Payment/sepay/ipn"


    $webhookUrl =
        "$BaseUrl/api/Payment/sepay/webhook"


    # --------------------------------------------------------
    # Console
    # --------------------------------------------------------

    Write-Host ""

    Write-Host "============================================" `
        -ForegroundColor Green

    Write-Host "Ngrok URL: $BaseUrl" `
        -ForegroundColor Green

    Write-Host ""

    Write-Host "  IPN:" `
        -ForegroundColor Cyan

    Write-Host "  $ipnUrl" `
        -ForegroundColor White

    Write-Host ""

    Write-Host "  Webhook:" `
        -ForegroundColor Cyan

    Write-Host "  $webhookUrl" `
        -ForegroundColor White

    Write-Host ""

    Write-Host "  Dashboard:" `
        -ForegroundColor Cyan

    Write-Host "  http://127.0.0.1:4040" `
        -ForegroundColor White

    Write-Host ""

    Write-Host "============================================" `
        -ForegroundColor Green

    Write-Host ""


    # --------------------------------------------------------
    # Save file
    # --------------------------------------------------------

    $content = @"
SePay Webhook URLs (ngrok)
Auto-updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')

NGROK_URL=$BaseUrl
IPN_URL=$ipnUrl
WEBHOOK_URL=$webhookUrl
"@


    $content | Set-Content `
        -Path $UrlsFile `
        -Encoding UTF8


    Write-Host "Da luu URL vao:" `
        -ForegroundColor Gray

    Write-Host "  $UrlsFile" `
        -ForegroundColor Gray

    Write-Host ""
}


# ============================================================
# MAIN
# ============================================================

Write-Host ""

Write-Host "============================================" `
    -ForegroundColor Cyan

Write-Host "     SePay Webhook + Ngrok Launcher" `
    -ForegroundColor Cyan

Write-Host "============================================" `
    -ForegroundColor Cyan

Write-Host ""


# ============================================================
# FIND NGROK.EXE
# ============================================================

$NgrokPath = Find-Ngrok


if (-not $NgrokPath) {

    Write-Host ""
    Write-Host "LOI: Khong tim thay ngrok.exe." `
        -ForegroundColor Red

    Write-Host ""

    Write-Host "Script da thu:" `
        -ForegroundColor Yellow

    Write-Host "  1. PATH -> ngrok.exe" `
        -ForegroundColor Gray

    Write-Host "  2. $env:USERPROFILE\Downloads\ngrok.exe" `
        -ForegroundColor Gray

    Write-Host "  3. $PSScriptRoot\ngrok.exe" `
        -ForegroundColor Gray

    Write-Host ""

    exit 1
}


Write-Host "Ngrok executable:" `
    -ForegroundColor Cyan

Write-Host "  $NgrokPath" `
    -ForegroundColor Green

Write-Host ""


# ============================================================
# CHECK NGROK VERSION
# ============================================================

try {

    $ngrokVersion = & $NgrokPath version 2>&1


    Write-Host "Ngrok version:" `
        -ForegroundColor Cyan

    Write-Host "  $ngrokVersion" `
        -ForegroundColor Gray

    Write-Host ""
}
catch {

    Write-Host ""
    Write-Host "LOI: Khong the chay ngrok.exe." `
        -ForegroundColor Red

    Write-Host $_.Exception.Message `
        -ForegroundColor Red

    Write-Host ""

    exit 1
}


# ============================================================
# CHECK API
# ============================================================

Write-Host `
    "Kiem tra API localhost:$Port ..." `
    -ForegroundColor Cyan


$apiRunning =
    Test-ApiListening `
        -TargetPort $Port


if (-not $apiRunning) {

    Write-Host ""

    Write-Host "CANH BAO: API chua phan hoi tai:" `
        -ForegroundColor Red

    Write-Host `
        "  http://localhost:$Port" `
        -ForegroundColor Yellow

    Write-Host ""

    Write-Host `
        "Ngrok van co the khoi dong, nhung SePay se nhan 502 neu API chua chay." `
        -ForegroundColor Yellow

    Write-Host ""

    Write-Host "Hay chay API truoc, vi du:" `
        -ForegroundColor Yellow

    Write-Host `
        "  cd src\ShoppingFood.API" `
        -ForegroundColor Gray

    Write-Host `
        "  dotnet run --launch-profile http" `
        -ForegroundColor Gray

    Write-Host ""
}
else {

    Write-Host `
        "API dang listening tai port $Port." `
        -ForegroundColor Green

    Write-Host ""
}


# ============================================================
# CHECK EXISTING NGROK
# ============================================================

Write-Host `
    "Kiem tra ngrok tunnel hien tai..." `
    -ForegroundColor Cyan


$existing =
    Get-ActiveNgrokUrl `
        -TargetPort $Port


# ============================================================
# EXISTING TUNNEL
# ============================================================

if ($existing -and -not $Restart) {

    Write-Host ""

    Write-Host `
        "Ngrok da chay san cho port $Port." `
        -ForegroundColor Yellow

    Write-Host `
        "Khong can khoi dong lai." `
        -ForegroundColor Yellow

    Write-WebhookInfo `
        -BaseUrl $existing


    # Check API again

    if (-not (Test-ApiListening -TargetPort $Port)) {

        Write-Host `
            "CANH BAO: API chua chay." `
            -ForegroundColor Red

        Write-Host `
            "Ngrok se tra 502 Bad Gateway." `
            -ForegroundColor Red
    }
    else {

        Write-Host `
            "API + Ngrok OK." `
            -ForegroundColor Green
    }


    exit 0
}


# ============================================================
# RESTART
# ============================================================

if ($Restart -or $existing) {

    Write-Host ""

    Write-Host `
        "Dang tat ngrok cu..." `
        -ForegroundColor Yellow

    Stop-NgrokProcesses
}


# ============================================================
# START NGROK
# ============================================================

Write-Host ""

Write-Host `
    "Khoi dong ngrok -> http://localhost:$Port" `
    -ForegroundColor Cyan

Write-Host ""

Write-Host `
    "Command:" `
    -ForegroundColor Gray

Write-Host `
    "  `"$NgrokPath`" http $Port" `
    -ForegroundColor Gray

Write-Host ""


try {

    $ngrokJob = Start-Process `
        -FilePath $NgrokPath `
        -ArgumentList @(
            "http",
            "$Port"
        ) `
        -PassThru `
        -WindowStyle Hidden


    Write-Host `
        "Ngrok da duoc start." `
        -ForegroundColor Green

    Write-Host `
        "PID: $($ngrokJob.Id)" `
        -ForegroundColor Gray

    Write-Host ""
}
catch {

    Write-Host ""

    Write-Host `
        "LOI: Khong the khoi dong ngrok." `
        -ForegroundColor Red

    Write-Host `
        $_.Exception.Message `
        -ForegroundColor Red

    Write-Host ""

    exit 1
}


# ============================================================
# WAIT FOR NGROK URL
# ============================================================

Write-Host `
    "Dang cho ngrok tao public URL..." `
    -ForegroundColor Yellow


$deadline =
    (Get-Date).AddSeconds(20)


$url = $null


while ((Get-Date) -lt $deadline) {

    Start-Sleep `
        -Milliseconds 500


    # Check process still alive

    try {

        $processCheck =
            Get-Process `
                -Id $ngrokJob.Id `
                -ErrorAction Stop

        if ($processCheck.HasExited) {

            break
        }
    }
    catch {

        # Process may have exited
        break
    }


    # Get tunnel URL

    $url =
        Get-ActiveNgrokUrl `
            -TargetPort $Port


    if ($url) {

        break
    }
}


# ============================================================
# URL NOT FOUND
# ============================================================

if (-not $url) {

    Write-Host ""

    Write-Host `
        "LOI: Khong lay duoc URL ngrok trong 20 giay." `
        -ForegroundColor Red

    Write-Host ""

    Write-Host `
        "Kiem tra dashboard:" `
        -ForegroundColor Yellow

    Write-Host `
        "  http://127.0.0.1:4040" `
        -ForegroundColor Gray

    Write-Host ""

    Write-Host `
        "Kiem tra truc tiep:" `
        -ForegroundColor Yellow

    Write-Host `
        "  `"$NgrokPath`" http $Port" `
        -ForegroundColor Gray

    Write-Host ""

    Write-Host `
        "Kiem tra auth token:" `
        -ForegroundColor Yellow

    Write-Host `
        "  `"$NgrokPath`" config check" `
        -ForegroundColor Gray

    Write-Host ""


    # Stop failed ngrok

    if ($ngrokJob) {

        try {

            Stop-Process `
                -Id $ngrokJob.Id `
                -Force `
                -ErrorAction SilentlyContinue
        }
        catch {
        }
    }


    exit 1
}


# ============================================================
# WEBHOOK INFORMATION
# ============================================================

Write-WebhookInfo `
    -BaseUrl $url


# ============================================================
# FINAL API CHECK
# ============================================================

if (-not (Test-ApiListening -TargetPort $Port)) {

    Write-Host ""

    Write-Host `
        "CANH BAO:" `
        -ForegroundColor Red

    Write-Host `
        "Ngrok da san sang nhung API van chua phan hoi." `
        -ForegroundColor Yellow

    Write-Host `
        "Webhook SePay se loi 502 cho den khi API chay." `
        -ForegroundColor Yellow

    Write-Host ""
}
else {

    Write-Host ""

    Write-Host "============================================" `
        -ForegroundColor Green

    Write-Host `
        "API + NGROK OK!" `
        -ForegroundColor Green

    Write-Host `
        "Webhook SePay co the nhan request." `
        -ForegroundColor Green

    Write-Host "============================================" `
        -ForegroundColor Green

    Write-Host ""
}


# ============================================================
# PROCESS INFORMATION
# ============================================================

Write-Host `
    "Ngrok PID: $($ngrokJob.Id)" `
    -ForegroundColor DarkGray

Write-Host `
    "De dung: Stop-Process -Id $($ngrokJob.Id)" `
    -ForegroundColor DarkGray

Write-Host ""