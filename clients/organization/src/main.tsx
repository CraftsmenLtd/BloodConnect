import './presentation/assets/styles/index.css'
import React from 'clients/commons/platform/node_modules/@types/react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '../../common/platform/aws/auth/amplify'

const rootElement = document.getElementById('root')

if (rootElement === null) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
