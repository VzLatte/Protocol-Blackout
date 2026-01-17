import React, { useState, useEffect } from 'react';

export const NetworkDebugger = () => {
  const [status, setStatus] = useState<{server: string, proxy: string, origin: string}>({
    server: 'Testing...',
    proxy: 'Testing...',
    origin: window.location.origin
  });

  const checkConnectivity = async () => {
    const host = window.location.hostname;
    const serverUrl = host.includes("github.dev") 
      ? `https://${host.replace("3000", "8080")}` 
      : "http://localhost:2567";

    const results = { server: 'Checking...', proxy: 'Checking...', origin: window.location.origin };

    // Test 1: HTTP Ping to Server
    try {
      const res = await fetch(serverUrl, { mode: 'no-cors' });
      results.server = "✅ Reachable (Opaque)";
    } catch (e) {
      results.server = "❌ Connection Refused (502/Down)";
    }

    // Test 2: Matchmaking Reachability
    try {
      const res = await fetch(`${serverUrl}/matchmake/joinOrCreate/combat_room`, { method: 'POST' });
      results.proxy = res.status === 405 ? "✅ API Active" : `❌ Error: ${res.status}`;
    } catch (e) {
      results.proxy = "❌ CORS or Proxy Auth Block";
    }

    setStatus(results);
  };

  return (
    <div style={{ padding: '20px', background: '#1a1a1a', color: '#fff', border: '1px solid red', margin: '10px' }}>
      <h3>📡 System Diagnostic</h3>
      <p>Origin: <code>{status.origin}</code></p>
      <p>Server 8080: <b>{status.server}</b></p>
      <p>API Handshake: <b>{status.proxy}</b></p>
      <button onClick={checkConnectivity} style={{ padding: '10px', background: '#333', color: '#fff' }}>Run Diagnostic</button>
      <div style={{ fontSize: '12px', marginTop: '10px', color: '#888' }}>
        * If Server is ❌, toggle Port 8080 to Private then Public. <br/>
        * If API is ❌, open the 8080 URL in a new tab and click 'Continue'.
      </div>
    </div>
  );
};