#!/bin/bash
WANTED="undead-server"
TMPFILE=$(mktemp)
trap "rm -f $TMPFILE; kill 0" EXIT
while true; do
  npx localtunnel --port 3000 --subdomain "$WANTED" > "$TMPFILE" 2>&1 &
  PID=$!
  sleep 2
  if grep -q "$WANTED" "$TMPFILE"; then
    echo "$(cat "$TMPFILE") - connected!"
    wait $PID
    echo "Tunnel died, restarting..."
  else
    echo "Wrong subdomain, retrying..."
    kill $PID 2>/dev/null
    wait $PID 2>/dev/null
  fi
  sleep 1
done
