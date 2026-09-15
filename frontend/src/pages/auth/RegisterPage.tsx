import { useState } from 'react'
import { Input, Switch } from '../../components'
import { navigate } from '../../router'
import { useSession } from '../../session/context'
import { AuthLayout } from './AuthLayout'
import styles from './AuthLayout.module.css'

export function RegisterPage() {
  const { register } = useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // The name typed here becomes the name Jarvis greets you with.
  const enter = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    const result = await register(name, email, password, keepSignedIn)
    setBusy(false)
    if (result.ok) navigate('boot')
    else setError(result.reason)
  }

  return (
    <AuthLayout
      mode="register"
      title="Set up your protocol"
      blurb="A few details and I will start tracking your days for you."
      cta="Create account"
      error={error}
      busy={busy}
      onSubmit={enter}
    >
      <div className={styles.fields}>
        <Input
          label="Name"
          name="name"
          autoComplete="name"
          placeholder="Your name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          autoComplete="new-password"
          placeholder="Your password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Switch checked={keepSignedIn} onChange={setKeepSignedIn} label="Keep me signed in" />
    </AuthLayout>
  )
}
