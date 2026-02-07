param(
  [string]$EdidName = 'XENEON EDGE',
  [string]$TabletPcWindowTitle = 'Tablet PC Settings'
)

# Uses EDID name (default: XENEON EDGE) to gate calibration startup.
# If no matching monitor is found, the script logs and exits.

$log = Join-Path $env:TEMP 'TouchCalibration.log'
('=== ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' ===') | Out-File -Append -FilePath $log

function Write-Log {
  param([string]$Message)
  $Message | Out-File -Append -FilePath $log
}

function Close-WindowByTitleContains {
  param([string]$TitlePart)

  $sig = @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class Win32Window {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
  [DllImport("user32.dll", CharSet=CharSet.Auto)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int maxCount);
  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
  public const uint WM_CLOSE = 0x0010;
}
'@

  if (-not ('Win32Window' -as [type])) { Add-Type -TypeDefinition $sig -Language CSharp }

  $handles = New-Object System.Collections.Generic.List[System.IntPtr]
  $callback = [Win32Window+EnumWindowsProc]{
    param([IntPtr]$hWnd, [IntPtr]$lParam)
    if (-not [Win32Window]::IsWindowVisible($hWnd)) { return $true }
    $len = [Win32Window]::GetWindowTextLength($hWnd)
    if ($len -le 0) { return $true }
    $sb = New-Object System.Text.StringBuilder ($len + 1)
    [Win32Window]::GetWindowText($hWnd, $sb, $sb.Capacity) | Out-Null
    $title = $sb.ToString()
    if ($title -like "*$TitlePart*") { $handles.Add($hWnd) | Out-Null }
    return $true
  }

  [Win32Window]::EnumWindows($callback, [IntPtr]::Zero) | Out-Null
  if ($handles.Count -gt 0) {
    foreach ($h in $handles) { [Win32Window]::SendMessage($h, [Win32Window]::WM_CLOSE, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null }
  }

  return $handles.Count
}

function Get-EdidMonitors {
  # Read EDID-friendly names from WMI
  $list = @()
  try {
    $monitors = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorID -ErrorAction Stop
    foreach ($m in $monitors) {
      $name = ($m.UserFriendlyName | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join ''
      if (-not $name) { $name = '<unknown>' }
      $list += [PSCustomObject]@{
        Name = $name
        InstanceName = $m.InstanceName
      }
    }
  } catch {
    # Leave list empty on failure
  }
  return $list
}

try {
  $monitors = Get-EdidMonitors
  if (-not $monitors -or $monitors.Count -eq 0) {
    Write-Log 'No EDID monitors found; aborting.'
    return
  }

  foreach ($m in $monitors) {
    Write-Log ("EDID Monitor: {0} ({1})" -f $m.Name, $m.InstanceName)
  }

  $matches = $monitors | Where-Object { $_.Name -like "*$EdidName*" }
  if (-not $matches -or $matches.Count -eq 0) {
    Write-Log ("EDID name not found: {0}; aborting." -f $EdidName)
    return
  }

  Write-Log ("Using EDID match: {0} ({1})" -f $matches[0].Name, $matches[0].InstanceName)

  # Open Tablet PC Calibration UI; user completes calibration manually
  $guid = '80F3F1D5-FECA-45F3-BC32-752C152E456E'
  $p = Start-Process -FilePath "$env:windir\explorer.exe" -ArgumentList "shell:::{${guid}}" -PassThru
  Write-Log ('Explorer PID: ' + $p.Id)
  Start-Sleep -Milliseconds 700

  $ws = New-Object -ComObject WScript.Shell
  $ok = $ws.AppActivate($p.Id)
  Write-Log ('AppActivate: ' + $ok)
  Start-Sleep -Milliseconds 200

  $ws.SendKeys('{ENTER}')
  Start-Sleep -Milliseconds 150

  # Close Tablet PC Settings window explicitly (not just the focused window)
  $closedCount = Close-WindowByTitleContains $TabletPcWindowTitle
  Write-Log ('Closed Tablet PC Settings count: ' + $closedCount)
  Start-Sleep -Milliseconds 150

  $ws.SendKeys('{ENTER}')
  Write-Log 'Sent Enter, close Tablet PC Settings, Enter'
} catch {
  Write-Log ('ERROR: ' + $_.Exception.Message)
  $_ | Out-String | Out-File -Append -FilePath $log
}
