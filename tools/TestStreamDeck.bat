@echo off
setlocal enabledelayedexpansion

:: Launch Stream Deck normally so the deployed/eye state remains enabled.
echo Launching Stream Deck normally...
start "Stream Deck" "C:\Program Files\Elgato\StreamDeck\StreamDeck.exe"

echo Done - Stream Deck should be running normally.
pause
