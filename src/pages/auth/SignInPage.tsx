import { useState } from 'react'
import { Input, Switch } from '../../components'
import { navigate } from '../../router'
import { useSession } from '../../session/context'
import { AuthLayout } from './AuthLayout'
import styles from './AuthLayout.module.css'

export function SignInPage() {
  const { signIn } = useSession()
  const [remember, setRemember] = useState(true)

  // No backend yet — accepting the form is what starts the session.
  const enter = () => {
    signIn()
    navigate('boot')
  }

  return (
    <AuthLayout
      mode="signin"
      title="Welcome back"
      blurb="Enter your credentials and I will bring the month back up."
      cta="Sign in"
      onSubmit={enter}
      onSocial={enter}
    >
      <div className={styles.fields}>
        <Input label="Email" type="email" name="email" autoComplete="email" placeholder="Your email address" />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
        />
      </div>
      <Switch checked={remember} onChange={setRemember} label="Remember me" />
    </AuthLayout>
  )
}
