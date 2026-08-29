import { GrowthContext } from './growth/context'
import { RegisterPage } from './pages/auth/RegisterPage'
import { SignInPage } from './pages/auth/SignInPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { GrowthPage } from './pages/growth/GrowthPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { SavingsPage } from './pages/savings/SavingsPage'
import { TaskTypesPage } from './pages/taskTypes/TaskTypesPage'
import { WelcomePage } from './pages/welcome/WelcomePage'
import { ProfileProvider } from './profile/ProfileProvider'
import { PursuitsProvider } from './pursuits/PursuitsProvider'
import { useRoute } from './router'
import { SavingsContext } from './savings/context'
import { SessionProvider } from './session/SessionProvider'
import { TaskTypesProvider } from './taskTypes/TaskTypesProvider'

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
    case 'savings':
      return <SavingsPage />
    case 'self-improvement':
      return <GrowthPage />
    case 'task-types':
      return <TaskTypesPage />
    case 'profile':
      return <ProfilePage />
    case 'welcome':
    default:
      return <WelcomePage variant="welcome" next="signin" />
  }
}

export default function App() {
  return (
    <SessionProvider>
      <TaskTypesProvider>
        <PursuitsProvider context={SavingsContext}>
          <PursuitsProvider context={GrowthContext}>
            <ProfileProvider>
              <Screen />
            </ProfileProvider>
          </PursuitsProvider>
        </PursuitsProvider>
      </TaskTypesProvider>
    </SessionProvider>
  )
}
