@echo off
setlocal enabledelayedexpansion

:: Launch Stream Deck with --runinbk flag (runs in background/tray)
echo Launching Stream Deck with --runinbk...
start "Stream Deck" "C:\Program Files\Elgato\StreamDeck\StreamDeck.exe" --runinbk

echo Done - Stream Deck should be running in tray
pause
