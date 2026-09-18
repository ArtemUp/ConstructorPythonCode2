import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './app/styles/global.css';
import { QueryProvider } from './app/providers/query-provider';
import { Router } from './app/providers/router';
import { ToastProvider } from './app/providers/ToastProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <ToastProvider>
        <Router />
      </ToastProvider>
    </QueryProvider>
  </React.StrictMode>
);