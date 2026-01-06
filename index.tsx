import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // This must exist in the same folder as this file

const rootElement = document.getElementById('root');

if (!rootElement) {
  // If this hits, your index.html is missing <div id="root">
  throw new Error('CRITICAL_FAILURE: Root container not found.');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);