@{
  Display = @{
    AdapterNameLike = '*RTX*'
    Width = 3440
    Height = 1440
    Refresh = 164
    PollSeconds = 10
    TimeoutSeconds = 300
  }

  Monitor = @{
    EdidName = 'XENEON EDGE'
    PollSeconds = 10
    TimeoutSeconds = 600
  }

  Delays = @{
    BeforeLaunchSeconds = 20
    CamWarmupSeconds = 10
    AidaCloseDelaySeconds = 5
  }

  Paths = @{
    NzxtCam = 'C:\Program Files\NZXT CAM\NZXT CAM.exe'
    OpenRgb = 'C:\Program Files\OpenRGB\OpenRGB.exe'
    Aida64 = 'D:\Aida64\aida64.exe'
    StreamDeck = 'C:\Program Files\Elgato\StreamDeck\StreamDeck.exe'
  }

  Processes = @{
    NzxtCam = 'NZXT CAM'
    Aida64 = 'aida64'
    StreamDeck = 'StreamDeck'
    OpenRgb = 'OpenRGB'
  }

  Behavior = @{
    RunTouchCalibrationOnResolutionRecovery = $true
  }
}
