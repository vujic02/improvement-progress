import { useEffect, useId, useRef, type ReactNode } from 'react'
import { IconButton } from './IconButton'
import styles from './Modal.module.css'

export interface ModalProps {
  open: boolean
  title: string
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
  /** Widen past the 560px default for anything with two columns. */
  width?: number
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Centred dialog over a dimmed backdrop. Closes on Escape and on a click
 * outside the panel; keeps Tab inside the panel while it is open.
 */
export function Modal({ open, title, subtitle, onClose, children, width }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // Escape to close, Tab wrapped at both ends, and the page frozen behind.
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!items.length) return

      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const returnTo = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown, true)

    // Autofocus the first field so the dialog is usable from the keyboard.
    const target = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
    target?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = overflow
      returnTo?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={width ? { maxWidth: width } : undefined}
      >
        <div className={styles.head}>
          <div className={styles.titles}>
            <span className={styles.title} id={titleId}>
              {title}
            </span>
            {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
          </div>
          <IconButton
            icon="close"
            label="Close"
            size={18}
            className={styles.close}
            onClick={onClose}
          />
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}
