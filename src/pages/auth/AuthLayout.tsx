import type { FormEvent, ReactNode } from 'react'
import { Button, Eyebrow, Icon, SegmentedToggle } from '../../components'
import { APP_NAME } from '../../lib/brand'
import { hrefFor, navigate } from '../../router'
import styles from './AuthLayout.module.css'

export type AuthMode = 'signin' | 'register'

const TABS = [
  { value: 'signin' as const, label: 'Sign in' },
  { value: 'register' as const, label: 'Register' },
]

export interface AuthLayoutProps {
  mode: AuthMode
  title: string
  blurb: string
  /** Label on the primary submit button. */
  cta: string
  /** The mode-specific fields and options. */
  children: ReactNode
  onSubmit: () => void
  /** Called when a social provider is used — same landing as a normal sign-in. */
  onSocial: () => void
}

/**
 * Shared shell for the two auth pages: artwork, glass card, mode tabs, social
 * providers and the cross-link. Each page supplies only its own fields.
 */
export function AuthLayout({
  mode,
  title,
  blurb,
  cta,
  children,
  onSubmit,
  onSocial,
}: AuthLayoutProps) {
  const other: AuthMode = mode === 'signin' ? 'register' : 'signin'

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <div className={styles.screen}>
      <div className={styles.art} />
      <div className={styles.artGlow} />
      <div className={styles.vignette} />
      <div className={styles.wash} />

      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.wordmark}>{APP_NAME}</span>
          <span className={styles.title}>{title}</span>
          <span className={styles.blurb}>{blurb}</span>
        </div>

        <SegmentedToggle
          options={TABS}
          value={mode}
          onChange={navigate}
          size="sm"
          grow
          label="Authentication mode"
        />

        <form className={styles.form} onSubmit={handleSubmit}>
          {children}
          <Button type="submit" size="lg" block>
            {cta}
          </Button>
        </form>

        <div className={styles.divider}>
          <span className={styles.rule} />
          <Eyebrow>Or</Eyebrow>
          <span className={styles.rule} />
        </div>

        <div className={styles.social}>
          <Button variant="ghost" size="md" block onClick={onSocial}>
            <Icon name="apple" size={15} />
            Apple
          </Button>
          <Button variant="ghost" size="md" block onClick={onSocial}>
            <Icon name="google" size={15} />
            Google
          </Button>
        </div>

        <div className={styles.foot}>
          <span>
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <a className={styles.footLink} href={hrefFor(other)}>
            {mode === 'signin' ? 'Register' : 'Sign in'}
          </a>
        </div>
      </div>
    </div>
  )
}
