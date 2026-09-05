import styles from './Footer.module.css'

export interface FooterLink {
  label: string
  href: string
}

export interface FooterProps {
  note: string
  links: FooterLink[]
}

export function Footer({ note, links }: FooterProps) {
  return (
    <footer className={styles.footer}>
      <span>{note}</span>
      <nav className={styles.links} aria-label="Footer">
        {links.map((link) => (
          <a key={link.label} className={styles.link} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
    </footer>
  )
}
