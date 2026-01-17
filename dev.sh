#!/bin/bash

echo "🚀 IGNITING PROTOCOL: BLACKOUT..."

# 1. Kill old processes
fuser -k 3000/tcp 8080/tcp > /dev/null 2>&1

# 2. Nuke Vite cache to prevent ghost styles
rm -rf protocol-client/node_modules/.vite

# 3. Start Server
cd protocol-server && npm run dev &
SERVER_PID=$!

# 4. Start Client (using the 3000 port from your config)
cd ../protocol-client && npm run dev &
CLIENT_PID=$!

trap "kill $SERVER_PID $CLIENT_PID" EXIT
wait