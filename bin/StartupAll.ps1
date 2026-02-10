param(
  [string]$ConfigPath,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
if (-not $ConfigPath) {
  $ConfigPath = Join-Path $repoRoot 'config\startup.config.psd1'
}

$logsDir = Join-Path $repoRoot 'logs'
if (-not (Test-Path -LiteralPath $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

$startupLog = Join-Path $logsDir 'StartupAll.log'

function Write-StartupLog {
  param([string]$Message)
  $line = '[{0}] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
  Add-Content -Path $startupLog -Value $line
}

function Stop-ProcessSafe {
  param([string]$Name)
  if ($DryRun) {
    Write-StartupLog ("DRYRUN stop process: {0}" -f $Name)
    return
  }

  Get-Process -Name $Name -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

function Close-MainWindowSafe {
  param([string]$Name)
  if ($DryRun) {
    Write-StartupLog ("DRYRUN close window: {0}" -f $Name)
    return
  }

  foreach ($proc in (Get-Process -Name $Name -ErrorAction SilentlyContinue)) {
    [void]$proc.CloseMainWindow()
  }
}

function Start-AppSafe {
  param(
    [string]$Path,
    [string]$Args
  )

  if ($DryRun) {
    if ($Args) {
      Write-StartupLog ("DRYRUN start: {0} {1}" -f $Path, $Args)
    } else {
      Write-StartupLog ("DRYRUN start: {0}" -f $Path)
    }
    return
  }

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing executable path: $Path"
  }

  if ($Args) {
    Start-Process -FilePath $Path -ArgumentList $Args | Out-Null
  } else {
    Start-Process -FilePath $Path | Out-Null
  }
}

function Get-CurrentDisplaySnapshot {
  param([string]$AdapterNameLike)

  $controllers = Get-CimInstance -ClassName Win32_VideoController |
    Where-Object { $_.Name -like $AdapterNameLike -and $_.CurrentHorizontalResolution -and $_.CurrentVerticalResolution -and $_.CurrentRefreshRate }

  $first = $controllers | Select-Object -First 1
  if (-not $first) {
    return $null
  }

  return [PSCustomObject]@{
    Width = [int]$first.CurrentHorizontalResolution
    Height = [int]$first.CurrentVerticalResolution
    Refresh = [int]$first.CurrentRefreshRate
    Name = [string]$first.Name
  }
}

function Wait-ForResolution {
  param(
    [hashtable]$DisplayConfig
  )

  if ($DryRun) {
    Write-StartupLog 'DRYRUN skipping resolution wait'
    return $false
  }

  $elapsed = 0
  while ($elapsed -lt [int]$DisplayConfig.TimeoutSeconds) {
    $snapshot = Get-CurrentDisplaySnapshot -AdapterNameLike $DisplayConfig.AdapterNameLike
    if ($snapshot -and
      $snapshot.Width -eq [int]$DisplayConfig.Width -and
      $snapshot.Height -eq [int]$DisplayConfig.Height -and
      $snapshot.Refresh -eq [int]$DisplayConfig.Refresh) {
      Write-StartupLog ("Display ready: {0} ({1}x{2}@{3})" -f $snapshot.Name, $snapshot.Width, $snapshot.Height, $snapshot.Refresh)
      return ($elapsed -gt 0)
    }

    Start-Sleep -Seconds ([int]$DisplayConfig.PollSeconds)
    $elapsed += [int]$DisplayConfig.PollSeconds
  }

  throw 'Timeout waiting for preferred resolution.'
}

function Get-EdidMonitorNames {
  $monitors = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorID -ErrorAction SilentlyContinue
  foreach ($monitor in $monitors) {
    ($monitor.UserFriendlyName | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join ''
  }
}

function Wait-ForMonitor {
  param([hashtable]$MonitorConfig)

  if ($DryRun) {
    Write-StartupLog 'DRYRUN skipping monitor wait'
    return $true
  }

  $elapsed = 0
  while ($elapsed -lt [int]$MonitorConfig.TimeoutSeconds) {
    $names = Get-EdidMonitorNames
    if ($names -and ($names | Where-Object { $_ -like "*$($MonitorConfig.EdidName)*" })) {
      Write-StartupLog ("Monitor detected: {0}" -f $MonitorConfig.EdidName)
      return $true
    }

    Write-StartupLog ("Monitor not detected yet: {0}" -f $MonitorConfig.EdidName)
    Start-Sleep -Seconds ([int]$MonitorConfig.PollSeconds)
    $elapsed += [int]$MonitorConfig.PollSeconds
  }

  return $false
}

function Invoke-TouchCalibration {
  $touchScript = Join-Path $scriptDir 'TouchCalibration.bat'
  if ($DryRun) {
    Write-StartupLog ("DRYRUN run touch calibration: {0}" -f $touchScript)
    return
  }

  if (-not (Test-Path -LiteralPath $touchScript)) {
    throw "Missing touch calibration launcher: $touchScript"
  }

  $process = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', "`"$touchScript`"" -Wait -PassThru
  if ($process.ExitCode -ne 0) {
    throw ("Touch calibration exited with code {0}" -f $process.ExitCode)
  }
}

try {
  if (-not (Test-Path -LiteralPath $ConfigPath)) {
    Write-StartupLog ("Missing config file: {0}" -f $ConfigPath)
    exit 10
  }

  $config = Import-PowerShellDataFile -Path $ConfigPath
  Write-StartupLog 'StartupAll begin'

  $resolutionRecovered = Wait-ForResolution -DisplayConfig $config.Display
  Write-StartupLog ("ResolutionRecovered={0}" -f $resolutionRecovered)

  Stop-ProcessSafe -Name $config.Processes.NzxtCam
  Stop-ProcessSafe -Name $config.Processes.Aida64
  Stop-ProcessSafe -Name $config.Processes.StreamDeck
  Stop-ProcessSafe -Name $config.Processes.SignalRgb

  if (-not $DryRun) {
    Start-Sleep -Seconds ([int]$config.Delays.BeforeLaunchSeconds)
  }

  Start-AppSafe -Path $config.Paths.NzxtCam

  if (-not $DryRun) {
    Start-Sleep -Seconds ([int]$config.Delays.CamWarmupSeconds)
  }

  Stop-ProcessSafe -Name $config.Processes.NzxtCam

  Stop-ProcessSafe -Name $config.Processes.SignalRgbLauncher
  Start-AppSafe -Path $config.Paths.SignalRgbLauncher

  if (-not $DryRun) {
    Start-Sleep -Seconds ([int]$config.Delays.SignalRgbCloseDelaySeconds)
  }

  Close-MainWindowSafe -Name $config.Processes.SignalRgbLauncher

  $monitorFound = Wait-ForMonitor -MonitorConfig $config.Monitor
  if (-not $monitorFound) {
    Write-StartupLog 'StartupAll done with monitor timeout'
    exit 30
  }

  if ($config.Behavior.RunTouchCalibrationOnResolutionRecovery -and $resolutionRecovered) {
    Write-StartupLog 'Running touch calibration'
    Invoke-TouchCalibration
  } else {
    Write-StartupLog 'Skipping touch calibration'
  }

  Stop-ProcessSafe -Name $config.Processes.Aida64
  Start-AppSafe -Path $config.Paths.Aida64

  if (-not $DryRun) {
    Start-Sleep -Seconds ([int]$config.Delays.AidaCloseDelaySeconds)
  }

  Close-MainWindowSafe -Name $config.Processes.Aida64

  Stop-ProcessSafe -Name $config.Processes.StreamDeck
  Start-AppSafe -Path $config.Paths.StreamDeck -Args '--runinbk'

  Write-StartupLog 'StartupAll done'
  exit 0
} catch {
  Write-StartupLog ("StartupAll error: {0}" -f $_.Exception.Message)
  exit 40
}
