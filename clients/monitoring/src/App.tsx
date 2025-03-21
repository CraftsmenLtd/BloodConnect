import GeohashMap from './components/GeohashMap'
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID,
      identityPoolId: import.meta.env.VITE_AWS_IDENTITY_POOL_ID,
      groups: [{ maintainers: { precedence: 1 } }],
      loginWith: {
        username: true,
      },
    }
  }
})

function App() {

  return (
    <Authenticator socialProviders={['google']}>
      <Router>
        <Routes>
          <Route path="/" element={<GeohashMap />} />
        </Routes>
      </Router>
    </Authenticator>
  )
}

export default App
