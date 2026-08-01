<#
.SYNOPSIS
  A control panel for the server: start, stop, watch, run commands, back up.

.DESCRIPTION
  Minecraft's built-in server GUI can only exist WHILE the server runs, so it
  cannot start one, cannot take a backup, and dies with the process. This is the
  window you actually want open.

  It speaks RCON directly over TCP rather than shelling out to python for every
  poll, so the status refresh costs nothing.

  Nothing here bypasses the safe-shutdown rule: Stop issues `save-all flush`
  then `stop`, the same as the command line does. Closing this window does NOT
  stop the server - that is deliberate, so an accidental close cannot cost you a
  world save.
#>
[CmdletBinding()]
param(
    [string]$InstanceDir = "C:\MCServer\instance",
    [string]$RepoRoot    = "C:\MCServer\repo"
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

# --- RCON over raw TCP -------------------------------------------------------
function Get-RconSettings {
    $props = Join-Path $InstanceDir "server.properties"
    $pw = ""; $port = 25575
    if (Test-Path $props) {
        foreach ($line in Get-Content $props) {
            if ($line -like "rcon.password=*") { $pw = $line.Substring(14).Trim() }
            elseif ($line -like "rcon.port=*")  { [int]::TryParse($line.Substring(10).Trim(), [ref]$port) | Out-Null }
        }
    }
    return @{ Password = $pw; Port = $port }
}

function Invoke-Rcon {
    param([string[]]$Commands, [int]$TimeoutMs = 4000)
    $cfg = Get-RconSettings
    if (-not $cfg.Password -or $cfg.Password -eq "CHANGE_ME_AT_SETUP") { return $null }
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $iar = $client.BeginConnect("127.0.0.1", $cfg.Port, $null, $null)
        if (-not $iar.AsyncWaitHandle.WaitOne($TimeoutMs)) { return $null }
        $client.EndConnect($iar)
        $client.ReceiveTimeout = $TimeoutMs
        $s = $client.GetStream()

        function Send-Packet($stream, [int]$id, [int]$type, [string]$body) {
            $b = [System.Text.Encoding]::UTF8.GetBytes($body)
            $len = 10 + $b.Length
            $w = New-Object System.IO.MemoryStream
            $bw = New-Object System.IO.BinaryWriter($w)
            $bw.Write([int]$len); $bw.Write([int]$id); $bw.Write([int]$type)
            $bw.Write($b); $bw.Write([byte]0); $bw.Write([byte]0); $bw.Flush()
            $bytes = $w.ToArray(); $stream.Write($bytes, 0, $bytes.Length); $stream.Flush()
        }
        function Read-Packet($stream) {
            $hdr = New-Object byte[] 4; $got = 0
            while ($got -lt 4) { $r = $stream.Read($hdr, $got, 4 - $got); if ($r -le 0) { return $null }; $got += $r }
            $len = [BitConverter]::ToInt32($hdr, 0)
            if ($len -lt 10 -or $len -gt 4200000) { return $null }
            $buf = New-Object byte[] $len; $got = 0
            while ($got -lt $len) { $r = $stream.Read($buf, $got, $len - $got); if ($r -le 0) { return $null }; $got += $r }
            $id = [BitConverter]::ToInt32($buf, 0)
            $body = [System.Text.Encoding]::UTF8.GetString($buf, 8, $len - 10)
            return @{ Id = $id; Body = $body }
        }

        Send-Packet $s 1 3 $cfg.Password
        $auth = Read-Packet $s
        if ($null -eq $auth -or $auth.Id -eq -1) { return $null }

        $out = @()
        foreach ($c in $Commands) {
            Send-Packet $s 2 2 $c
            $resp = Read-Packet $s
            if ($null -ne $resp) { $out += $resp.Body } else { $out += "" }
        }
        return $out
    } catch { return $null }
    finally { $client.Close() }
}

function Get-ServerProcess {
    Get-CimInstance Win32_Process -Filter "Name='java.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -like "*$InstanceDir*" } | Select-Object -First 1
}

# --- UI ----------------------------------------------------------------------
$form                = New-Object System.Windows.Forms.Form
$form.Text           = "Cogs & Cadavers - Server Control"
$form.Size           = New-Object System.Drawing.Size(760, 560)
$form.StartPosition  = "CenterScreen"
$form.BackColor      = [System.Drawing.Color]::FromArgb(30, 30, 34)
$form.ForeColor      = [System.Drawing.Color]::Gainsboro
$form.Font           = New-Object System.Drawing.Font("Segoe UI", 9)

function New-Label($text, $x, $y, $w, $h, $size, $bold) {
    $l = New-Object System.Windows.Forms.Label
    $l.Text = $text; $l.Location = New-Object System.Drawing.Point($x, $y)
    $l.Size = New-Object System.Drawing.Size($w, $h)
    $style = [System.Drawing.FontStyle]::Regular
    if ($bold) { $style = [System.Drawing.FontStyle]::Bold }
    $l.Font = New-Object System.Drawing.Font("Segoe UI", $size, $style)
    $form.Controls.Add($l); return $l
}
function New-Button($text, $x, $y, $w) {
    $b = New-Object System.Windows.Forms.Button
    $b.Text = $text; $b.Location = New-Object System.Drawing.Point($x, $y)
    $b.Size = New-Object System.Drawing.Size($w, 34)
    $b.FlatStyle = "Flat"; $b.BackColor = [System.Drawing.Color]::FromArgb(52, 52, 58)
    $b.ForeColor = [System.Drawing.Color]::Gainsboro
    $form.Controls.Add($b); return $b
}

$lblStatus = New-Label "checking..." 20 16 420 30 14 $true
$lblDetail = New-Label "" 20 48 700 20 9 $false
$lblDetail.ForeColor = [System.Drawing.Color]::DarkGray

$btnStart  = New-Button "Start"   20  78 110
$btnStop   = New-Button "Stop"   140  78 110
$btnBackup = New-Button "Backup" 260  78 110
$btnFolder = New-Button "Folder" 380  78 110

$lblAddr = New-Label "" 500 82 230 40 8 $false
$lblAddr.ForeColor = [System.Drawing.Color]::FromArgb(120, 180, 120)

New-Label "Players online" 20 124 200 18 9 $true | Out-Null
$lstPlayers = New-Object System.Windows.Forms.ListBox
$lstPlayers.Location = New-Object System.Drawing.Point(20, 146)
$lstPlayers.Size = New-Object System.Drawing.Size(220, 320)
$lstPlayers.BackColor = [System.Drawing.Color]::FromArgb(24, 24, 28)
$lstPlayers.ForeColor = [System.Drawing.Color]::Gainsboro
$lstPlayers.BorderStyle = "FixedSingle"
$form.Controls.Add($lstPlayers)

New-Label "Console" 260 124 200 18 9 $true | Out-Null
$txtLog = New-Object System.Windows.Forms.TextBox
$txtLog.Location = New-Object System.Drawing.Point(260, 146)
$txtLog.Size = New-Object System.Drawing.Size(470, 285)
$txtLog.Multiline = $true; $txtLog.ScrollBars = "Vertical"; $txtLog.ReadOnly = $true
$txtLog.BackColor = [System.Drawing.Color]::FromArgb(24, 24, 28)
$txtLog.ForeColor = [System.Drawing.Color]::Gainsboro
$txtLog.Font = New-Object System.Drawing.Font("Consolas", 9)
$form.Controls.Add($txtLog)

$txtCmd = New-Object System.Windows.Forms.TextBox
$txtCmd.Location = New-Object System.Drawing.Point(260, 437)
$txtCmd.Size = New-Object System.Drawing.Size(380, 26)
$txtCmd.BackColor = [System.Drawing.Color]::FromArgb(24, 24, 28)
$txtCmd.ForeColor = [System.Drawing.Color]::Gainsboro
$txtCmd.Font = New-Object System.Drawing.Font("Consolas", 9)
$form.Controls.Add($txtCmd)
$btnSend = New-Button "Send" 648 435 82

$lblHint = New-Label "Closing this window does NOT stop the server." 20 478 500 20 8 $false
$lblHint.ForeColor = [System.Drawing.Color]::DimGray

function Write-Log($text) {
    $stamp = (Get-Date).ToString("HH:mm:ss")
    $txtLog.AppendText("[$stamp] $text`r`n")
}

# Read the tunnel addresses so they are visible and copyable.
$vc = Join-Path $InstanceDir "config\voicechat\voicechat-server.properties"
$voiceHost = ""
if (Test-Path $vc) {
    $m = Select-String -Path $vc -Pattern '^voice_host=(.+)$'
    if ($m) { $voiceHost = $m.Matches[0].Groups[1].Value }
}
$lblAddr.Text = "voice: $voiceHost"

# --- polling -----------------------------------------------------------------
$script:busy = $false
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 3000
$timer.Add_Tick({
    if ($script:busy) { return }
    $script:busy = $true
    try {
        $proc = Get-ServerProcess
        if (-not $proc) {
            $lblStatus.Text = "STOPPED"
            $lblStatus.ForeColor = [System.Drawing.Color]::IndianRed
            $lblDetail.Text = "server is not running"
            $lstPlayers.Items.Clear()
            $btnStart.Enabled = $true; $btnStop.Enabled = $false; $btnSend.Enabled = $false
            return
        }
        $res = Invoke-Rcon -Commands @("list")
        if ($null -eq $res) {
            $lblStatus.Text = "STARTING..."
            $lblStatus.ForeColor = [System.Drawing.Color]::Goldenrod
            $lblDetail.Text = "loading mods - this takes a minute; RCON is not up yet"
            $btnStart.Enabled = $false; $btnStop.Enabled = $false; $btnSend.Enabled = $false
            return
        }
        $btnStart.Enabled = $false; $btnStop.Enabled = $true; $btnSend.Enabled = $true
        $lblStatus.Text = "RUNNING"
        $lblStatus.ForeColor = [System.Drawing.Color]::MediumSeaGreen

        $mem = [math]::Round($proc.WorkingSetSize / 1GB, 1)
        $up = ""
        try {
            $span = (Get-Date) - $proc.CreationDate
            $up = "{0:00}h {1:00}m" -f [int]$span.TotalHours, $span.Minutes
        } catch { }
        $lblDetail.Text = "pid $($proc.ProcessId)   memory $mem GB   uptime $up"

        $line = $res[0]
        $lstPlayers.Items.Clear()
        if ($line -match 'There are (\d+) of a max of (\d+) players online:?\s*(.*)$') {
            $names = $Matches[3].Trim()
            if ($names) { foreach ($n in ($names -split ',\s*')) { [void]$lstPlayers.Items.Add($n.Trim()) } }
            else { [void]$lstPlayers.Items.Add("(nobody online)") }
        }
    } finally { $script:busy = $false }
})

# --- actions -----------------------------------------------------------------
$btnStart.Add_Click({
    Write-Log "starting server..."
    $btnStart.Enabled = $false
    $psi = "-NoProfile -ExecutionPolicy Bypass -File `"$RepoRoot\server\scripts\start.ps1`" -InstanceDir `"$InstanceDir`""
    Start-Process powershell -ArgumentList $psi -WindowStyle Minimized
    Write-Log "launched - first boot takes a few minutes"
})

$btnStop.Add_Click({
    $ok = [System.Windows.Forms.MessageBox]::Show(
        "Save and stop the server?", "Confirm", "YesNo", "Question")
    if ($ok -ne "Yes") { return }
    Write-Log "save-all flush, then stop..."
    $btnStop.Enabled = $false
    $r = Invoke-Rcon -Commands @("save-all flush", "stop") -TimeoutMs 30000
    if ($null -eq $r) { Write-Log "RCON unreachable - server may already be stopping" }
    else { Write-Log "stop issued; world saved" }
})

$btnBackup.Add_Click({
    $proc = Get-ServerProcess
    if ($proc) {
        Write-Log "flushing world before backup..."
        Invoke-Rcon -Commands @("save-off", "save-all flush") -TimeoutMs 30000 | Out-Null
    }
    Write-Log "running backup (this can take a minute)..."
    $bk = "$RepoRoot\server\scripts\backup.ps1"
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$bk`" -InstanceDir `"$InstanceDir`" -Force" -Wait -WindowStyle Minimized
    if ($proc) { Invoke-Rcon -Commands @("save-on") | Out-Null; Write-Log "saves re-enabled" }
    Write-Log "backup finished"
})

$btnFolder.Add_Click({ Start-Process explorer.exe $InstanceDir })

$sendCommand = {
    $c = $txtCmd.Text.Trim()
    if (-not $c) { return }
    $txtCmd.Clear()
    Write-Log "> $c"
    $r = Invoke-Rcon -Commands @($c)
    if ($null -eq $r) { Write-Log "  (no response - server not reachable)" }
    elseif ($r[0]) { foreach ($ln in ($r[0] -split "`n")) { if ($ln.Trim()) { Write-Log "  $($ln.Trim())" } } }
    else { Write-Log "  (ok)" }
}
$btnSend.Add_Click($sendCommand)
$txtCmd.Add_KeyDown({ if ($_.KeyCode -eq "Enter") { $_.SuppressKeyPress = $true; & $sendCommand } })

Write-Log "panel ready - instance: $InstanceDir"
$timer.Start()
[void]$form.ShowDialog()
$timer.Stop()
