import { useState } from 'react'
import { Input, Switch } from '../../components'
import { navigate } from '../../router'
import { useSession } from '../../session/context'
import { AuthLayout } from './AuthLayout'
import styles from './AuthLayout.module.css'

export function RegisterPage() {
  const { signIn } = useSession()
  const [name, setName] = useState('')
  const [keepSignedIn, setKeepSignedIn] = useState(true)

  // The name typed here becomes the name Jarvis greets you with.
  const enter = () => {
    signIn(name)
    navigate('boot')
  }

  return (
    <AuthLayout
      mode="register"
      title="Set up your protocol"
      blurb="A few details and I will start tracking your days for you."
      cta="Create account"
      onSubmit={enter}
      onSocial={() => {
        signIn()
        navigate('boot')
      }}
    >
      <div className={styles.fields}>
        <Input
          label="Name"
          name="name"
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input label="Email" type="email" name="email" autoComplete="email" placeholder="Your email address" />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="Your password"
        />
      </div>
      <Switch checked={keepSignedIn} onChange={setKeepSignedIn} label="Keep me signed in" />
    </AuthLayout>
  )
}
