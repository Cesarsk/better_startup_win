:: Kill all apps first for true idempotency
taskkill /f /im "NZXT CAM.exe" > nul 2>&1
taskkill /f /im "aida64.exe" > nul 2>&1
taskkill /f /im "StreamDeck.exe" > nul 2>&1
taskkill /f /im "SignalRGB.exe" > nul 2>&1
