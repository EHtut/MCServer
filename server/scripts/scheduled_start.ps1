# Bring the server up from Windows Task Scheduler.
#
# NOT just a call to start.ps1. It enforces the one rule that matters, learned
# by breaking it: NEVER launch while another JVM is alive. On 2026-08-02 a
# stop-and-restart helper inferred "stopped" from a memory threshold, started a
# second server on the same world directory, and only got caught because Ethan
# noticed. Two JVMs sharing one world can corrupt it.
#
# A scheduled task is exactly where that goes wrong unattended, so this refuses
# to start rather than risk it, and leaves a log saying why.

$ErrorActionPreference = "Stop"
$log = "C:\MCServer\instance\logs\scheduled-start.log"
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null

function Note($m) {
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $m
    Add-Content -Path $log -Value $line -Encoding utf8
}

Note "--- scheduled start fired ---"

$running = @(Get-Process -Name java -ErrorAction SilentlyContinue)
if ($running.Count -gt 0) {
    Note ("REFUSED: {0} java process(es) already running: {1}" -f
          $running.Count, ($running.Id -join ", "))
    Note "Refusing to start a second server on one world. Stop the running one first."
    exit 1
}

Note "0 java processes - safe to start"
Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "C:\MCServer\repo\server\scripts\start.ps1" `
    -WorkingDirectory "C:\MCServer\instance" `
    -WindowStyle Minimized

# Confirm it actually came up rather than assuming the launch worked.
$deadline = (Get-Date).AddSeconds(420)
$up = $false
while ((Get-Date) -lt $deadline) {
    try {
        $c = New-Object Net.Sockets.TcpClient
        $c.Connect("127.0.0.1", 25575)
        $c.Close()
        $up = $true
        break
    } catch { Start-Sleep -Seconds 5 }
}

$n = @(Get-Process -Name java -ErrorAction SilentlyContinue).Count
if ($up) { Note "UP: RCON answering, java process count = $n" }
else      { Note "TIMEOUT: RCON never answered after 7 min, java process count = $n" }
