import './presentation/assets/styles/index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../../commons/platform/aws/auth/amplify';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
