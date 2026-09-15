import { useState } from 'react'
import { Input, Switch } from '../../components'
import { navigate } from '../../router'
import { useSession } from '../../session/context'
import { AuthLayout } from './AuthLayout'
import styles from './AuthLayout.module.css'

export function SignInPage() {
  const { signIn, notice } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const enter = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    const result = await signIn(email, password, remember)
    setBusy(false)
    if (result.ok) navigate('boot')
    else setError(result.reason)
  }

  return (
    <AuthLayout
      mode="signin"
      title="Welcome back"
      blurb="Enter your credentials and I will bring the month back up."
      cta="Sign in"
      // Until this form has something to report, say why the last session ended, if it ended on its own.
      error={error ?? notice}
      busy={busy}
      onSubmit={enter}
    >
      <div className={styles.fields}>
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Your email address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Switch checked={remember} onChange={setRemember} label="Remember me" />
    </AuthLayout>
  )
}
