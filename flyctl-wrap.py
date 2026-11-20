#!/usr/bin/env python3
"""Run flyctl with the custom.flyio-stealer Org Deploy Token (surrogate form).

The surrogate is placed in FLY_API_TOKEN inside this process only and never
printed. The runtime swaps it for the real token on requests to Fly hosts.

Usage: flyctl-wrap.py <flyctl args...>
"""
import os
import sys

sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import dynamic_credential_entry

entry = dynamic_credential_entry("custom.flyio-stealer")
os.environ["FLY_API_TOKEN"] = entry["surrogate"]
os.execv(os.path.expanduser("~/workspace/tools/flyctl-bin/flyctl"),
         ["flyctl"] + sys.argv[1:])
