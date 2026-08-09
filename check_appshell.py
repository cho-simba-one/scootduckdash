#!/usr/bin/env python3
"""
Verify the service worker's APP_SHELL lists every JS module on disk.

A module missing from the precache list fails SILENTLY for online users --
network-first quietly fetches it at runtime -- but leaves anyone who installs
the PWA and goes offline with a broken app shell. That's a nasty class of bug
to find by hand, so we check it mechanically instead.

Run after adding or renaming any file under js/.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SW = os.path.join(HERE, "service-worker.js")
JS_DIR = os.path.join(HERE, "js")


def main():
    source = open(SW, encoding="utf-8").read()

    block = re.search(r"const APP_SHELL = \[(.*?)\];", source, re.S)
    if not block:
        sys.exit("could not find APP_SHELL in service-worker.js")
    listed = set(re.findall(r"'\./js/([^']+)'", block.group(1)))

    on_disk = {f for f in os.listdir(JS_DIR) if f.endswith(".js")}

    missing = sorted(on_disk - listed)   # on disk but not precached
    stale = sorted(listed - on_disk)     # precached but gone -> breaks install

    version = re.search(r"CACHE_NAME = '([^']+)'", source)
    print(f"cache: {version.group(1) if version else '?'}")
    print(f"js modules on disk: {len(on_disk)} | listed in APP_SHELL: {len(listed)}")

    if missing:
        print(f"\nMISSING from APP_SHELL (breaks offline): {missing}")
    if stale:
        print(f"\nSTALE in APP_SHELL (404 rejects the whole install): {stale}")

    if missing or stale:
        return 1
    print("\nAPP_SHELL_OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
