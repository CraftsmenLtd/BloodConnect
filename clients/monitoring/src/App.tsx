import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { Amplify } from 'aws-amplify'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import Trace from './pages/Trace'
import { AwsProvider, useAws } from './hooks/AwsContext'
import { DataProvider } from './hooks/DataContext';
import { Container, Spinner } from 'react-bootstrap'

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

const AwsProviderWrapper = () => {
  const { loading, error, credentials } = useAws()

  if (!credentials) {
    return <Container style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '95.8vh',
    }}>
      {
        error && (
          <>
            <div>{error.name}</div>
            <div>{error.message}</div>
            <div>{error.stack}</div>
          </>
        )
      }
      {
        loading && ( 
          <Spinner animation="border" role="status" />
        )
      }
    </Container>
  }

  return <Routes>
    <Route
      path='/'
      element={<Home />} />
    <Route
      path='/trace'
      element={<Trace />} />

  </Routes>
}

const App = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      justifyContent: 'center'
    }}
    className="bg-dark"
    >
      <Authenticator
        socialProviders={['google']}
        hideSignUp>
        <Router>
          <NavBar />
          <AwsProvider>
            <DataProvider>
              <AwsProviderWrapper />
            </DataProvider>
          </AwsProvider>
        </Router>
      </Authenticator>
    </div>
  )
}

export default App
