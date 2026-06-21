import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { Amplify } from 'aws-amplify'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import AppShell from './layout/AppShell'
import Live from './pages/Live'
import MapExplorer from './pages/MapExplorer'
import DonorSearches from './pages/DonorSearches'
import RequestDetail from './pages/RequestDetail'
import Lookup from './pages/Lookup'
import { AwsProvider } from './hooks/AwsContext'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID,
      identityPoolId: import.meta.env.VITE_AWS_IDENTITY_POOL_ID,
      groups: [{ maintainers: { precedence: 1 } }],
      loginWith: {
        username: true,
        oauth: {
          domain: import.meta.env.VITE_AWS_COGNITO_DOMAIN,
          redirectSignIn: [import.meta.env.VITE_AWS_REDIRECT_SIGN_IN],
          redirectSignOut: [import.meta.env.VITE_AWS_REDIRECT_SIGN_OUT],
          responseType: 'code',
          scopes: ['email', 'openid', 'profile'],
          providers: ['Google', 'Facebook']
        }
      }
    }
  }
})

const App = () => (
  <Authenticator
    socialProviders={['google']}
    hideSignUp>
    <AwsProvider>
      <Router>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Live />} />
            <Route path="/searches" element={<DonorSearches />} />
            <Route
              path="/request/:seekerId/:createdAt/:requestPostId"
              element={<RequestDetail />} />
            <Route path="/map" element={<MapExplorer />} />
            <Route path="/lookup" element={<Lookup />} />
          </Route>
        </Routes>
      </Router>
    </AwsProvider>
  </Authenticator>
)

export default App
