import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './auth/AuthContext';
import './index.css';
import { AppRouter } from './routes';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
