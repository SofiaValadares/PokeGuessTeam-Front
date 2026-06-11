import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ApiAvailabilityGate } from './components/ApiAvailabilityGate';
import { AuthProvider } from './store/providers';
import './index.css';
import { AppRouter } from './routes';
import reportWebVitals from './reportWebVitals';
import { store } from './store/store';
import { ThemeProvider } from './theme';
import { PreferencesProvider } from './preferences';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <PreferencesProvider>
          <ApiAvailabilityGate>
            <AuthProvider>
              <AppRouter />
            </AuthProvider>
          </ApiAvailabilityGate>
        </PreferencesProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);

reportWebVitals();
