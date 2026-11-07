#!/bin/sh
# Only P3's later allocation authorises this one-shot invocation.
set -eu
if [ "$#" -ne 3 ]; then
  echo 'usage: invoke.sh SEAL_SHA256 NEW_OUTPUT_DIRECTORY ALLOCATION_ID' >&2
  exit 64
fi
packet=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
python=/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/bin/python3.9
deadline=$("$python" -I -S -B -c 'from datetime import datetime,timedelta,timezone; print((datetime.now(timezone.utc)+timedelta(seconds=180)).isoformat())')
exec "$python" -I -S -B "$packet/run_once.py" --packet "$packet" \
  --seal-sha256 "$1" --output "$2" --allocation "$3" --deadline-utc "$deadline"
