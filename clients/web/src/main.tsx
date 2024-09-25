import './presentation/assets/styles/index.css';
import awsConfig from './config/awsExports';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Amplify } from 'aws-amplify';
import React from 'react';
import ReactDOM from 'react-dom/client';
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
        <App />
    </QueryClientProvider>
  </React.StrictMode>
);
