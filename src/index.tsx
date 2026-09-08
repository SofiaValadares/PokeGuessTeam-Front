import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { Provider } from 'react-redux';
import './index.css';
import { AppRouter } from './routes';
import reportWebVitals from './reportWebVitals';
import { store } from './store/store';
import { startMatchPersistence } from './store/matchPersistence';
import { ThemeProvider } from './theme';
import { PreferencesProvider } from './preferences';

startMatchPersistence(store);

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  // eslint-disable-next-line no-console
  console.error('REACT_APP_CLERK_PUBLISHABLE_KEY em falta (.env.local)');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey ?? ''}>
      <Provider store={store}>
        <ThemeProvider>
          <PreferencesProvider>
            <AppRouter />
          </PreferencesProvider>
        </ThemeProvider>
      </Provider>
    </ClerkProvider>
  </React.StrictMode>
);

reportWebVitals();
