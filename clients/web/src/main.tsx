import '@web/presentation/assets/styles/index.css';
import awsConfig from '@shared/config/awsExports';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Amplify } from 'aws-amplify';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from '@web/redux/store';
import App from './App';

const queryClient = new QueryClient();
Amplify.configure(awsConfig);

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <App />
      </Provider>
    </QueryClientProvider>
  </React.StrictMode>
);
