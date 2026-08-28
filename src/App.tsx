import { RegisterPage } from './pages/auth/RegisterPage'
import { SignInPage } from './pages/auth/SignInPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { WelcomePage } from './pages/welcome/WelcomePage'
import { useRoute } from './router'
import { SessionProvider } from './session/SessionProvider'

function Screen() {
  const route = useRoute()

  switch (route) {
    case 'signin':
      return <SignInPage />
    case 'register':
      return <RegisterPage />
    case 'boot':
      // Second pass of the Jarvis greeting, played after auth.
      return <WelcomePage variant="boot" next="dashboard" />
    case 'dashboard':
      return <DashboardPage />
    case 'welcome':
    default:
      return <WelcomePage variant="welcome" next="signin" />
  }
}

export default function App() {
  return (
    <SessionProvider>
      <Screen />
    </SessionProvider>
  )
}
