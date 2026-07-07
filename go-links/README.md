# go links

Type `go/outlook`, `go/excel`, etc. in any browser and get redirected to the
right URL. Runs locally on your Mac; a tiny stdlib Python server on port 80 that
302-redirects based on `links.json`.

## How it works

1. `/etc/hosts` maps the hostname `go` to `127.0.0.1`.
2. `goserver.py` listens on port 80, reads the shortcut from the path, looks it
   up in `links.json`, and returns a 302 redirect.
3. Bare `go/` or an unknown shortcut shows the list of all shortcuts.

Works in every browser because resolution happens at the OS layer, not per-browser.

## Prerequisites

Just **Python 3** — everything the server uses is standard library (no `pip
install`, no Node). macOS provides it through the Command Line Tools. On a fresh
Mac that's missing them, `/usr/bin/python3` will prompt to install; or run:

```sh
xcode-select --install     # installs Command Line Tools -> /usr/bin/python3
python3 --version          # confirm it works
```

If you instead installed Python via Homebrew, it lives at
`/opt/homebrew/bin/python3` — update the path in `com.golinks.plist` to match.

## Setup (once)

```sh
cd ~/Github/utils/go-links

# 0. Preflight: fail loudly if python3 is missing
command -v /usr/bin/python3 >/dev/null || { echo "Run: xcode-select --install"; exit 1; }

# 1. Point the "go" hostname at localhost
echo "127.0.0.1 go" | sudo tee -a /etc/hosts

# 2. Install & start the background service (needs root for port 80)
sudo cp com.golinks.plist /Library/LaunchDaemons/
sudo launchctl load /Library/LaunchDaemons/com.golinks.plist
```

To run it by hand (e.g. while editing the code), stop the daemon first — both
bind port 80, so running both gives `Address already in use`:

```sh
sudo launchctl unload /Library/LaunchDaemons/com.golinks.plist
sudo python3 goserver.py        # Ctrl-C to stop, then reload the daemon below
```

## Adding shortcuts

Edit `links.json`, save. No restart needed — the server re-reads it per request.

```json
{
  "outlook": "https://outlook.office.com/mail/",
  "jira": "https://your-org.atlassian.net"
}
```

## Verify

```sh
# Use GET, not -I/HEAD: the server only handles GET (as browsers do).
curl -s -o /dev/null -D - http://go/outlook   # -> 302, Location: https://outlook.office.com/mail/
curl -s http://go/                            # -> HTML list of all shortcuts
```

## Managing the service

```sh
sudo launchctl unload /Library/LaunchDaemons/com.golinks.plist   # stop
sudo launchctl load   /Library/LaunchDaemons/com.golinks.plist   # start
cat /tmp/golinks.err.log                                         # errors
```

## Later: run it for the whole home network

Same code, run on an always-on box on your LAN. Two things change vs. the
laptop setup: (1) the server must bind `0.0.0.0` (not `127.0.0.1`) so other
devices can reach it, and (2) every device must resolve `go` to the server's IP
instead of localhost.

**Common prep (both platforms):**

- Give the server a **fixed IP** so `go` never points at the wrong place. Easiest
  is a DHCP reservation in your router (bind the box's MAC to an IP, e.g.
  `192.168.1.50`). Use that IP everywhere below.
- Edit `goserver.py`, last line, change the bind address:
  ```python
  HTTPServer(("0.0.0.0", 80), Handler).serve_forever()
  ```
- Keep it **LAN-only** — do not port-forward port 80 to the internet. It's an
  open redirector with no auth; that's fine inside your home, not on the public net.

### Option A: Raspberry Pi (Raspberry Pi OS / Linux — uses systemd)

Python 3 is preinstalled on Raspberry Pi OS (`python3 --version` to confirm).
Assumes your login user is `pi`; adjust paths if it's something else.

```sh
# 1. Copy the util onto the Pi (run from your Mac, or git clone on the Pi)
scp goserver.py links.json pi@192.168.1.50:/home/pi/go-links/

# 2. On the Pi: create a systemd service (Linux's launchd equivalent)
sudo tee /etc/systemd/system/golinks.service >/dev/null <<'UNIT'
[Unit]
Description=go links redirect server
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/bin/python3 /home/pi/go-links/goserver.py
Restart=always
User=root
# root is needed to bind port 80

[Install]
WantedBy=multi-user.target
UNIT

# 3. Enable at boot + start now
sudo systemctl daemon-reload
sudo systemctl enable --now golinks

# 4. Check it
systemctl status golinks          # should say "active (running)"
journalctl -u golinks -n 20       # logs if something's wrong
curl -s http://localhost/         # HTML list of shortcuts
```

Manage it later: `sudo systemctl restart golinks` (after editing files),
`sudo systemctl stop golinks`, `sudo systemctl disable golinks` (stop auto-start).

### Option B: Mac mini (macOS — uses launchd, same as your laptop)

Identical to the laptop setup, just with `0.0.0.0` and the mini's own paths.

```sh
# 1. Put the util somewhere on the mini, e.g. ~/Github/utils/go-links
#    (git clone the repo, or copy goserver.py + links.json + com.golinks.plist)

# 2. Point the plist at the real path on the mini.
#    Edit com.golinks.plist so the second <string> under ProgramArguments is:
#      /Users/<you>/Github/utils/go-links/goserver.py

# 3. Install + start the daemon (needs root for port 80)
sudo cp com.golinks.plist /Library/LaunchDaemons/
sudo launchctl load /Library/LaunchDaemons/com.golinks.plist

# 4. Check it
curl -s http://localhost/         # HTML list of shortcuts
cat /tmp/golinks.err.log          # errors, if any
```

If macOS's firewall is on (System Settings → Network → Firewall), allow
incoming connections for `python3` when prompted, or other devices can't reach it.
Manage it with the same `launchctl unload/load` commands as on your laptop.

### Point your devices at the server

However you run it, each device needs `go` → the server's IP. Pick one:

- **Per device (quick, works everywhere):** add one line to the device's hosts file.
  - macOS / Linux: `echo "192.168.1.50 go" | sudo tee -a /etc/hosts`
  - Windows: edit `C:\Windows\System32\drivers\etc\hosts` as Administrator, add
    `192.168.1.50 go`
  - iOS / Android: no hosts file — these need the DNS option below.
- **Once for the whole network (best):** add a local DNS record `go → 192.168.1.50`
  on your router, or on Pi-hole / AdGuard Home if you run one. Every device
  (phones included) then resolves `go` automatically, no per-device edits.

Note: on the server itself, `localhost` reaches it; add `127.0.0.1 go` to the
server's own `/etc/hosts` if you also want to type `go/...` on that machine.

`links.json` and the redirect logic are identical on every platform — only the
service wrapper (systemd vs. launchd) and the `go` → IP mapping differ.
