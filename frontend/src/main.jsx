import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './AuthContext.jsx';
import { hashUntukPath } from './authPath.js';
import './styles.css';

// /auth/login dan /auth/register langsung menampilkan form (sebelum React dirender).
const tujuan = hashUntukPath(window.location.pathname, window.location.hash);
if (tujuan) window.history.replaceState(null, '', window.location.pathname + tujuan);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
