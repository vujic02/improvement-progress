import { useEffect } from 'react'
import { DaysProvider } from './days/DaysProvider'
import { DreamsContext } from './dreams/context'
import { GrowthContext } from './growth/context'
import { RegisterPage } from './pages/auth/RegisterPage'
import { SignInPage } from './pages/auth/SignInPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { DreamsPage } from './pages/dreams/DreamsPage'
import { GrowthPage } from './pages/growth/GrowthPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { SavingsPage } from './pages/savings/SavingsPage'
import { TaskTypesPage } from './pages/taskTypes/TaskTypesPage'
import { WelcomePage } from './pages/welcome/WelcomePage'
import { ProfileProvider } from './profile/ProfileProvider'
import { PursuitsProvider } from './pursuits/PursuitsProvider'
import { navigate, useRoute, type Route } from './router'
import { SavingsContext } from './savings/context'
import { useSession, type SessionStatus } from './session/context'
import { SessionProvider } from './session/SessionProvider'
import { TaskTypesProvider } from './taskTypes/TaskTypesProvider'

/** Routes open without an account. Every other route needs a signed-in session. */
const PUBLIC_ROUTES: readonly Route[] = ['welcome', 'signin', 'register']

/**
 * Where this session should be sent instead of `route`, or null to stay. A
 * signed-in visitor on an auth screen goes to the boot greeting — the same
 * place the sign-in and register forms send them on success.
 */
function redirectFor(route: Route, status: SessionStatus): Route | null {
  if (status === 'checking') return null
  const open = PUBLIC_ROUTES.includes(route)
  if (status === 'out' && !open) return 'signin'
  if (status === 'in' && open) return 'boot'
  return null
}

function Screen() {
  const route = useRoute()
  const { status } = useSession()
  const redirect = redirectFor(route, status)

  useEffect(() => {
    if (redirect) navigate(redirect, { replace: true })
  }, [redirect])

  // Nothing renders while a stored token is being confirmed, or on a route
  // that is about to be left — so a protected page never flashes.
  if (status === 'checking' || redirect) return null

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
    case 'dreams':
      return <DreamsPage />
    case 'task-types':
      return <TaskTypesPage />
    case 'profile':
      return <ProfilePage />
    case 'welcome':
    default:
      return <WelcomePage variant="welcome" next="signin" />
  }
}

/**
 * Everything the signed-in account owns. Keyed on the account, so signing out
 * or into someone else starts from a clean slate instead of showing the last
 * user's task types, goals and settings.
 */
function AccountScope() {
  const { user } = useSession()

  return (
    <TaskTypesProvider key={user?.id ?? 'signed-out'}>
      <DaysProvider>
        <PursuitsProvider context={SavingsContext}>
          <PursuitsProvider context={GrowthContext}>
            <PursuitsProvider context={DreamsContext}>
              <ProfileProvider>
                <Screen />
              </ProfileProvider>
            </PursuitsProvider>
          </PursuitsProvider>
        </PursuitsProvider>
      </DaysProvider>
    </TaskTypesProvider>
  )
}

export default function App() {
  return (
    <SessionProvider>
      <AccountScope />
    </SessionProvider>
  )
}
