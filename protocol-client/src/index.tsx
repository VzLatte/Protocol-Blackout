import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; 

// Tactical Debug: Confirms the script is actually executing
console.log(">> PROTOCOL_BLACKOUT: CORE_ENGINE_BOOTING...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error(">> CRITICAL_ERROR: TARGET_ROOT_NOT_FOUND");
  throw new Error('CRITICAL_FAILURE: Root container not found.');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);