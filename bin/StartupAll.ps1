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
  param(
    [string]$Name,
    [int]$TimeoutSeconds = 15
  )
  if ($DryRun) {
    Write-StartupLog ("DRYRUN stop process: {0}" -f $Name)
    return
  }

  $processes = @(Get-Process -Name $Name -ErrorAction SilentlyContinue)
  if ($processes.Count -eq 0) {
    return
  }

  $processes | Stop-Process -Force -ErrorAction SilentlyContinue

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    if (-not (Get-Process -Name $Name -ErrorAction SilentlyContinue)) {
      return
    }

    Start-Sleep -Milliseconds 250
  } while ((Get-Date) -lt $deadline)

  throw "Timed out waiting for process to stop: $Name"
}

function Start-AppSafe {
  param(
    [string]$Path,
    [string[]]$ArgumentList,
    [string]$WindowStyle,
    [switch]$Wait
  )

  if ($DryRun) {
    if ($ArgumentList) {
      Write-StartupLog ("DRYRUN start: {0} {1}" -f $Path, ($ArgumentList -join ' '))
    } else {
      Write-StartupLog ("DRYRUN start: {0}" -f $Path)
    }
    return
  }

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing executable path: $Path"
  }

  $startArgs = @{
    FilePath = $Path
  }

  if ($ArgumentList) {
    $startArgs.ArgumentList = $ArgumentList
  }
  if ($WindowStyle) {
    $startArgs.WindowStyle = $WindowStyle
  }
  if ($Wait) {
    $startArgs.Wait = $true
    $startArgs.PassThru = $true
  }

  $process = Start-Process @startArgs
  if ($Wait -and $process.ExitCode -ne 0) {
    throw "Process exited with code $($process.ExitCode): $Path"
  }
}

function Write-OpenRgbSdkPacket {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [UInt32]$DeviceIndex = 0,
    [UInt32]$PacketId,
    [byte[]]$Payload = [byte[]]::new(0)
  )

  $header = [byte[]]::new(16)
  [System.Text.Encoding]::ASCII.GetBytes('ORGB').CopyTo($header, 0)
  [BitConverter]::GetBytes($DeviceIndex).CopyTo($header, 4)
  [BitConverter]::GetBytes($PacketId).CopyTo($header, 8)
  [BitConverter]::GetBytes([UInt32]$Payload.Length).CopyTo($header, 12)

  $Stream.Write($header, 0, $header.Length)
  if ($Payload.Length -gt 0) {
    $Stream.Write($Payload, 0, $Payload.Length)
  }
  $Stream.Flush()
}

function Read-OpenRgbExactBytes {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$Length
  )

  $buffer = [byte[]]::new($Length)
  $offset = 0
  while ($offset -lt $Length) {
    $read = $Stream.Read($buffer, $offset, $Length - $offset)
    if ($read -le 0) {
      throw 'OpenRGB SDK connection closed while reading.'
    }
    $offset += $read
  }

  return $buffer
}

function Read-OpenRgbSdkPacket {
  param([System.Net.Sockets.NetworkStream]$Stream)

  $header = Read-OpenRgbExactBytes -Stream $Stream -Length 16
  $magic = [System.Text.Encoding]::ASCII.GetString($header, 0, 4)
  if ($magic -ne 'ORGB') {
    throw "Unexpected OpenRGB SDK packet magic: $magic"
  }

  $size = [BitConverter]::ToUInt32($header, 12)
  $payload = [byte[]]::new(0)
  if ($size -gt 0) {
    $payload = Read-OpenRgbExactBytes -Stream $Stream -Length ([int]$size)
  }

  return [PSCustomObject]@{
    DeviceIndex = [BitConverter]::ToUInt32($header, 4)
    PacketId = [BitConverter]::ToUInt32($header, 8)
    Payload = $payload
  }
}

function Read-OpenRgbSdkResponsePacket {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [UInt32]$PacketId
  )

  do {
    $reply = Read-OpenRgbSdkPacket -Stream $Stream
  } while ($reply.PacketId -eq 100)

  if ($reply.PacketId -ne $PacketId) {
    throw "Unexpected OpenRGB SDK packet id: $($reply.PacketId); expected $PacketId."
  }

  return $reply
}

function Read-OpenRgbUInt16 {
  param([byte[]]$Data, [ref]$Offset)

  $value = [BitConverter]::ToUInt16($Data, $Offset.Value)
  $Offset.Value += 2
  return $value
}

function Read-OpenRgbInt32 {
  param([byte[]]$Data, [ref]$Offset)

  $value = [BitConverter]::ToInt32($Data, $Offset.Value)
  $Offset.Value += 4
  return $value
}

function Skip-OpenRgbString {
  param([byte[]]$Data, [ref]$Offset)

  $length = Read-OpenRgbUInt16 -Data $Data -Offset $Offset
  $Offset.Value += $length
}

function Skip-OpenRgbModeEntry {
  param(
    [byte[]]$Data,
    [ref]$Offset,
    [int]$ProtocolVersion
  )

  Skip-OpenRgbString -Data $Data -Offset $Offset
  $Offset.Value += 16
  if ($ProtocolVersion -ge 3) {
    $Offset.Value += 8
  }
  $Offset.Value += 12
  if ($ProtocolVersion -ge 3) {
    $Offset.Value += 4
  }
  $Offset.Value += 8
  $colorCount = Read-OpenRgbUInt16 -Data $Data -Offset $Offset
  $Offset.Value += (4 * $colorCount)
}

function Get-OpenRgbActiveModePayload {
  param(
    [byte[]]$ControllerData,
    [int]$ProtocolVersion
  )

  $offset = 4
  $offset += 4
  $offsetRef = [ref]$offset

  Skip-OpenRgbString -Data $ControllerData -Offset $offsetRef
  if ($ProtocolVersion -ge 1) {
    Skip-OpenRgbString -Data $ControllerData -Offset $offsetRef
  }
  Skip-OpenRgbString -Data $ControllerData -Offset $offsetRef
  Skip-OpenRgbString -Data $ControllerData -Offset $offsetRef
  Skip-OpenRgbString -Data $ControllerData -Offset $offsetRef
  Skip-OpenRgbString -Data $ControllerData -Offset $offsetRef

  $modeCount = Read-OpenRgbUInt16 -Data $ControllerData -Offset $offsetRef
  $activeMode = Read-OpenRgbInt32 -Data $ControllerData -Offset $offsetRef
  if ($activeMode -lt 0 -or $activeMode -ge $modeCount) {
    throw "OpenRGB SDK active mode index out of range: $activeMode of $modeCount"
  }

  for ($modeIndex = 0; $modeIndex -lt $modeCount; $modeIndex++) {
    $modeStart = $offsetRef.Value
    Skip-OpenRgbModeEntry -Data $ControllerData -Offset $offsetRef -ProtocolVersion $ProtocolVersion
    if ($modeIndex -eq $activeMode) {
      $modeLength = $offsetRef.Value - $modeStart
      $payloadLength = 8 + $modeLength
      $payload = [byte[]]::new($payloadLength)
      [BitConverter]::GetBytes([UInt32]$payloadLength).CopyTo($payload, 0)
      [BitConverter]::GetBytes([Int32]$activeMode).CopyTo($payload, 4)
      [Array]::Copy($ControllerData, $modeStart, $payload, 8, $modeLength)
      return $payload
    }
  }

  throw 'OpenRGB SDK active mode not found in controller data.'
}

function Get-OpenRgbColorPayload {
  param(
    [byte[]]$ControllerData,
    [int]$ProtocolVersion
  )

  $offset = 8
  $offsetRef = [ref]$offset

  Skip-OpenRgbString -Data $ControllerData -Offset $offsetRef
  if ($ProtocolVersion -ge 1) {
    Skip-OpenRgbString -Data $ControllerData -Offset $offsetRef
  }
  Skip-OpenRgbString -Data $ControllerData -Offset $offsetRef
  Skip-OpenRgbString -Data $ControllerData -Offset $offsetRef
  Skip-OpenRgbString -Data $ControllerData -Offset $offsetRef
  Skip-OpenRgbString -Data $ControllerData -Offset $offsetRef

  $modeCount = Read-OpenRgbUInt16 -Data $ControllerData -Offset $offsetRef
  $offsetRef.Value += 4
  for ($modeIndex = 0; $modeIndex -lt $modeCount; $modeIndex++) {
    Skip-OpenRgbModeEntry -Data $ControllerData -Offset $offsetRef -ProtocolVersion $ProtocolVersion
  }

  $zoneCount = Read-OpenRgbUInt16 -Data $ControllerData -Offset $offsetRef
  for ($zoneIndex = 0; $zoneIndex -lt $zoneCount; $zoneIndex++) {
    Skip-OpenRgbString -Data $ControllerData -Offset $offsetRef
    $offsetRef.Value += 16
    $matrixLength = Read-OpenRgbUInt16 -Data $ControllerData -Offset $offsetRef
    $offsetRef.Value += $matrixLength
    if ($ProtocolVersion -ge 4) {
      $segmentCount = Read-OpenRgbUInt16 -Data $ControllerData -Offset $offsetRef
      for ($segmentIndex = 0; $segmentIndex -lt $segmentCount; $segmentIndex++) {
        Skip-OpenRgbString -Data $ControllerData -Offset $offsetRef
        $offsetRef.Value += 12
      }
    }
    if ($ProtocolVersion -ge 5) {
      $offsetRef.Value += 4
    }
  }

  $ledCount = Read-OpenRgbUInt16 -Data $ControllerData -Offset $offsetRef
  for ($ledIndex = 0; $ledIndex -lt $ledCount; $ledIndex++) {
    Skip-OpenRgbString -Data $ControllerData -Offset $offsetRef
    $offsetRef.Value += 4
  }

  $colorStart = $offsetRef.Value
  $colorCount = Read-OpenRgbUInt16 -Data $ControllerData -Offset $offsetRef
  $colorDataLength = 2 + (4 * $colorCount)
  $payloadLength = 4 + $colorDataLength
  $payload = [byte[]]::new($payloadLength)
  [BitConverter]::GetBytes([UInt32]$payloadLength).CopyTo($payload, 0)
  [Array]::Copy($ControllerData, $colorStart, $payload, 4, $colorDataLength)
  return $payload
}

function Send-OpenRgbTargetedControllerUpdates {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$ProtocolVersion,
    [string[]]$NamePatterns,
    [int]$RepeatCount = 1,
    [int]$RepeatDelayMilliseconds = 1000
  )

  Write-OpenRgbSdkPacket -Stream $Stream -PacketId 0
  $countReply = Read-OpenRgbSdkResponsePacket -Stream $Stream -PacketId 0
  if ($countReply.Payload.Length -lt 4) {
    throw 'OpenRGB SDK controller count request failed.'
  }

  $controllerCount = [BitConverter]::ToUInt32($countReply.Payload, 0)
  $targetIndexes = @()
  for ($controllerIndex = 0; $controllerIndex -lt $controllerCount; $controllerIndex++) {
    if ($ProtocolVersion -gt 0) {
      Write-OpenRgbSdkPacket -Stream $Stream -DeviceIndex ([UInt32]$controllerIndex) -PacketId 1 -Payload ([BitConverter]::GetBytes([UInt32]$ProtocolVersion))
    } else {
      Write-OpenRgbSdkPacket -Stream $Stream -DeviceIndex ([UInt32]$controllerIndex) -PacketId 1
    }
    $dataReply = Read-OpenRgbSdkResponsePacket -Stream $Stream -PacketId 1
    $controllerName = Get-OpenRgbControllerName -ControllerData $dataReply.Payload
    $matched = @($NamePatterns | Where-Object {
      $pattern = $_
      $controllerName -like "*$pattern*"
    })

    if ($matched.Count -gt 0) {
      $targetIndexes += [int]$controllerIndex
    }
  }

  for ($repeatIndex = 0; $repeatIndex -lt $RepeatCount; $repeatIndex++) {
    foreach ($controllerIndex in $targetIndexes) {
      if ($ProtocolVersion -gt 0) {
        Write-OpenRgbSdkPacket -Stream $Stream -DeviceIndex ([UInt32]$controllerIndex) -PacketId 1 -Payload ([BitConverter]::GetBytes([UInt32]$ProtocolVersion))
      } else {
        Write-OpenRgbSdkPacket -Stream $Stream -DeviceIndex ([UInt32]$controllerIndex) -PacketId 1
      }
      $dataReply = Read-OpenRgbSdkResponsePacket -Stream $Stream -PacketId 1

      $modePayload = Get-OpenRgbActiveModePayload -ControllerData $dataReply.Payload -ProtocolVersion $ProtocolVersion
      Write-OpenRgbSdkPacket -Stream $Stream -DeviceIndex ([UInt32]$controllerIndex) -PacketId 1101 -Payload $modePayload

      $colorPayload = Get-OpenRgbColorPayload -ControllerData $dataReply.Payload -ProtocolVersion $ProtocolVersion
      Write-OpenRgbSdkPacket -Stream $Stream -DeviceIndex ([UInt32]$controllerIndex) -PacketId 1050 -Payload $colorPayload
    }

    if ($repeatIndex -lt ($RepeatCount - 1)) {
      Start-Sleep -Milliseconds $RepeatDelayMilliseconds
    }
  }

  return [int]$targetIndexes.Count
}

function Get-OpenRgbControllerName {
  param([byte[]]$ControllerData)

  $offset = 8
  $offsetRef = [ref]$offset
  $length = Read-OpenRgbUInt16 -Data $ControllerData -Offset $offsetRef
  return [System.Text.Encoding]::UTF8.GetString($ControllerData, $offsetRef.Value, $length).TrimEnd([char]0)
}

function Get-OpenRgbControllerNames {
  param(
    [string]$ServerHost = '127.0.0.1',
    [int]$Port = 6742
  )

  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $connect = $client.BeginConnect($ServerHost, $Port, $null, $null)
    if (-not $connect.AsyncWaitHandle.WaitOne(5000)) {
      throw "Timed out connecting to OpenRGB SDK server at ${ServerHost}:${Port}."
    }
    $client.EndConnect($connect)
    $stream = $client.GetStream()
    $stream.ReadTimeout = 5000
    $stream.WriteTimeout = 5000

    Write-OpenRgbSdkPacket -Stream $stream -PacketId 0
    $countReply = Read-OpenRgbSdkResponsePacket -Stream $stream -PacketId 0
    if ($countReply.Payload.Length -lt 4) {
      throw 'OpenRGB SDK controller count request failed.'
    }

    $controllerCount = [BitConverter]::ToUInt32($countReply.Payload, 0)
    $names = @()
    for ($controllerIndex = 0; $controllerIndex -lt $controllerCount; $controllerIndex++) {
      Write-OpenRgbSdkPacket -Stream $stream -DeviceIndex ([UInt32]$controllerIndex) -PacketId 1
      $dataReply = Read-OpenRgbSdkResponsePacket -Stream $stream -PacketId 1
      $names += Get-OpenRgbControllerName -ControllerData $dataReply.Payload
    }

    return $names
  } finally {
    $client.Close()
  }
}

function Wait-ForOpenRgbControllers {
  param(
    [string[]]$NamePatterns,
    [int]$TimeoutSeconds = 45
  )

  if ($DryRun) {
    Write-StartupLog ("DRYRUN wait for OpenRGB controllers: {0}" -f ($NamePatterns -join ', '))
    return $true
  }

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  $lastNames = @()
  $previousCount = -1
  $stableSince = $null
  do {
    $lastNames = @(Get-OpenRgbControllerNames)
    $missing = @($NamePatterns | Where-Object {
      $pattern = $_
      -not ($lastNames | Where-Object { $_ -like "*$pattern*" })
    })

    If ($missing.Count -eq 0) {
      $currentCount = $lastNames.Count
      if ($currentCount -eq $previousCount -and $currentCount -gt 0) {
        if (-not $stableSince) {
          $stableSince = Get-Date
        } elseif (((Get-Date) - $stableSince).TotalSeconds -ge 3) {
          Write-StartupLog ("OpenRGB controllers ready: {0}" -f ($lastNames -join ', '))
          return $true
        }
      } else {
        $previousCount = $currentCount
        $stableSince = $null
      }
    } else {
      $previousCount = -1
      $stableSince = $null
    }

    Start-Sleep -Seconds 1
  } while ((Get-Date) -lt $deadline)

  Write-StartupLog ("OpenRGB controllers not all detected before profile load. Missing: {0}. Available: {1}" -f ($missing -join ', '), ($lastNames -join ', '))
  return $false
}

function Wait-ForOpenRgbSdkServer {
  param(
    [string]$ServerHost = '127.0.0.1',
    [int]$Port = 6742,
    [int]$TimeoutSeconds = 30
  )

  if ($DryRun) {
    Write-StartupLog ("DRYRUN wait for OpenRGB SDK server: {0}:{1}" -f $ServerHost, $Port)
    return
  }

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    $listener = Get-NetTCPConnection -LocalAddress $ServerHost -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($listener) {
      Write-StartupLog ("OpenRGB SDK server ready: {0}:{1}" -f $ServerHost, $Port)
      return
    }

    Start-Sleep -Milliseconds 500
  } while ((Get-Date) -lt $deadline)

  throw "OpenRGB SDK server did not become ready at ${ServerHost}:${Port}."
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

  Stop-ProcessSafe -Name $config.Processes.OpenRgb

  if (-not $DryRun) {
    Start-Sleep -Seconds ([int]$config.Delays.BeforeLaunchSeconds)
  }

  Start-AppSafe -Path $config.Paths.OpenRgb -ArgumentList @('--noautoconnect', '--server', '--server-host', '127.0.0.1', '--server-port', '6742', '--startminimized') -WindowStyle Minimized
  Wait-ForOpenRgbSdkServer -TimeoutSeconds 30
  [void](Wait-ForOpenRgbControllers -NamePatterns @('Govee') -TimeoutSeconds 45)
  if (-not $DryRun) {
    Start-Sleep -Seconds 5
  }

  if ($config.Behavior.RunTouchCalibrationOnResolutionRecovery -and $resolutionRecovered) {
    Write-StartupLog 'Running touch calibration'
    Invoke-TouchCalibration
  } else {
    Write-StartupLog 'Skipping touch calibration'
  }

  Write-StartupLog 'StartupAll done'
  exit 0
} catch {
  Write-StartupLog ("StartupAll error: {0}" -f $_.Exception.Message)
  exit 40
}
