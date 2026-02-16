import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../renderer/index.css'; // Use existing Tailwind CSS

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
