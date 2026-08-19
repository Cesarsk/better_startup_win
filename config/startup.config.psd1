@{
  Display = @{
    AdapterNameLike = '*RTX*'
    Width = 3440
    Height = 1440
    Refresh = 164
    PollSeconds = 10
    TimeoutSeconds = 300
  }

  Delays = @{
    BeforeLaunchSeconds = 20
  }

  Paths = @{
    OpenRgb = 'C:\Program Files\OpenRGB\OpenRGB.exe'
  }

  Processes = @{
    OpenRgb = 'OpenRGB'
  }

  Behavior = @{
    RunTouchCalibrationOnResolutionRecovery = $true
  }
}
