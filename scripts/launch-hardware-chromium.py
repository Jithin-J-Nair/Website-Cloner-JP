#!/usr/bin/env python3
"""Opt-in launcher for a target laptop's installed, headed Chrome.

Use CHROMIUM_EXECUTABLE_PATH=this file and HARDWARE_CHROME=absolute Chrome binary.
Only launch flags change; application timing, assets and test assertions do not.
Requires a real desktop session. This wrapper does not prove acceleration: retain
chrome://gpu and the pipeline probe's unmasked renderer and reject software results.
"""
import os
import sys

chrome = os.environ.get("HARDWARE_CHROME", "")
if not os.path.isabs(chrome) or not os.access(chrome, os.X_OK):
    sys.exit("HARDWARE_CHROME must name an executable installed Chrome binary (absolute path)")

# Both the original acceptance harness and the diagnostic helper explicitly ask
# for SwiftShader. Remove those backend/headless/serverless overrides, retaining
# Playwright's transport/profile flags. Let the installed browser select its GPU.
drop = {
    "--single-process", "--in-process-gpu", "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist", "--no-sandbox", "--disable-setuid-sandbox",
    "--no-zygote", "--disable-web-security", "--disable-site-isolation-trials",
    "--allow-running-insecure-content",
}
args = [arg for arg in sys.argv[1:] if arg not in drop and not arg.startswith(
    ("--headless", "--use-angle=", "--use-gl=", "--disable-gpu"))]
os.execv(chrome, [chrome, *args])
