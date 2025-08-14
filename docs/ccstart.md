# ccstart — One-command CC jumpstart

## macOS
1) Ensure `scripts/ccstart.sh` is executable:
   ```bash
   chmod +x scripts/ccstart.sh
   ```

2) Add alias to your shell:
   ```bash
   echo 'alias ccstart="'$PWD'/scripts/ccstart.sh"' >> ~/.zshrc && source ~/.zshrc
   ```

3) Use it anytime:
   ```bash
   ccstart
   ```

## Windows (PowerShell)
```powershell
# scripts\ccstart.ps1
$root = (git rev-parse --show-toplevel) 2>$null
if (-not $root) { $root = (Get-Location) }
Set-Location $root
if (!(Test-Path BOOTSTRAP.md) -or !(Test-Path .bootstrap_hash)) { Write-Host "Missing guardrail files"; exit 1 }
$expected = Get-Content .bootstrap_hash -Raw
$current = (Get-FileHash BOOTSTRAP.md -Algorithm SHA256).Hash.ToLower()
if ($expected.Trim().ToLower() -ne $current) { Write-Host "Hash mismatch"; exit 1 }
Get-Content BOOTSTRAP.md -Raw | Set-Clipboard
code --command workbench.action.chat.start
Write-Host "Paste (Ctrl+V) in the Chat and press Enter."
```

## Linux (GNOME/KDE)

Install `xclip` and `xdotool`. Example:

```bash
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"; cd "$ROOT"
EXPECTED="$(cat .bootstrap_hash)"; CURRENT="$(sha256sum BOOTSTRAP.md | awk '{print $1}')"
[ "$EXPECTED" = "$CURRENT" ] || { echo "Hash mismatch"; exit 1; }
xclip -selection clipboard < BOOTSTRAP.md
code --command workbench.action.chat.start &
sleep 2
xdotool type --delay 1 --clearmodifiers "$(cat BOOTSTRAP.md)"
xdotool key Return
```