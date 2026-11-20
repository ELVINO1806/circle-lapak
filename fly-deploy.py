#!/usr/bin/env python3
"""Launch/update the mint-safety-verdict Fly machine via the Machines API.

Uses the custom.flyio-stealer connector credential pattern (surrogate swapped
by the runtime on requests to api.machines.dev only). Never prints the token.

Usage:
  fly-deploy.py create     # create machine msv-1 (boot: git clone + npm ci + node server.mjs)
  fly-deploy.py list       # list machines
  fly-deploy.py wait <id>  # wait for machine to reach started
"""
import json
import sys
import urllib.request

sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import add_surrogate_to_request, read_json_response

ALLOWED = ["api.fly.io", "api.machines.dev"]
APP = "mint-safety-verdict"
BASE = f"https://api.machines.dev/v1/apps/{APP}/machines"


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        raise RuntimeError("redirect refused, verify the endpoint")


def call(method, url, payload=None, timeout=60):
    data = json.dumps(payload).encode() if payload is not None else None
    request = urllib.request.Request(url, data=data, method=method)
    if data is not None:
        request.add_header("Content-Type", "application/json")
    add_surrogate_to_request(request, "custom.flyio-stealer", allowed_hosts=ALLOWED)
    opener = urllib.request.build_opener(NoRedirect())
    try:
        with opener.open(request, timeout=timeout) as response:
            return read_json_response(response)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        print(json.dumps({"http_status": e.code, "body": body[:2000]}, indent=2))
        sys.exit(1)


BOOT = (
    "mkdir -p /srv/app && cd /srv/app && "
    "if [ -d .git ]; then git fetch --depth 1 origin master && git reset --hard origin/master; "
    "else git clone --depth 1 https://github.com/ELVINO1806/circle-lapak.git .; fi && "
    "npm ci --omit=dev --no-audit --no-fund && exec node server.mjs"
)

MACHINE = {
    "name": "msv-1",
    "region": "sin",
    "config": {
        "image": "node:22",
        "env": {
            "PORT": "8080",
            "CIRCLE_NETWORK": "testnet",
            "SELLER_ADDRESS": "0x79d8E04dB4cb31F6dA2F02f6AdB4FB38e0A8AA54",
        },
        "init": {"cmd": ["bash", "-lc", BOOT], "user": "root"},
        "guest": {"cpu_kind": "shared", "cpus": 1, "memory_mb": 1024},
        "services": [
            {
                "protocol": "tcp",
                "internal_port": 8080,
                "autostart": True,
                "autostop": False,
                "ports": [
                    {"port": 80, "handlers": ["http"], "force_https": True},
                    {"port": 443, "handlers": ["tls", "http"]},
                ],
            }
        ],
        "checks": {
            "health": {
                "type": "http",
                "port": 8080,
                "method": "GET",
                "path": "/health",
                "interval": "30s",
                "timeout": "5s",
                "grace_period": "240s",
            }
        },
        "restart": {"policy": "always"},
    },
}


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "create":
        if len(sys.argv) > 2:
            MACHINE["name"] = sys.argv[2]
        print(json.dumps(call("POST", BASE, MACHINE, timeout=120), indent=2))
    elif cmd == "list":
        print(json.dumps(call("GET", BASE), indent=2))
    elif cmd == "wait":
        url = f"{BASE}/{sys.argv[2]}/wait?state=started&timeout=60"
        print(json.dumps(call("GET", url, timeout=90), indent=2))
    elif cmd == "restart":
        print(json.dumps(call("POST", f"{BASE}/{sys.argv[2]}/restart", {}, timeout=120), indent=2))
    elif cmd == "destroy":
        print(json.dumps(call("DELETE", f"{BASE}/{sys.argv[2]}?force=true", timeout=120), indent=2))
    else:
        print(__doc__)
        sys.exit(2)


if __name__ == "__main__":
    main()
