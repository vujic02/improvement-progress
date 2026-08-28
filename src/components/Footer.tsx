import styles from './Footer.module.css'

export interface FooterProps {
  note: string
  links: string[]
}

export function Footer({ note, links }: FooterProps) {
  return (
    <footer className={styles.footer}>
      <span>{note}</span>
      <nav className={styles.links} aria-label="Footer">
        {links.map((link) => (
          <a key={link} className={styles.link} href="#/dashboard">
            {link}
          </a>
        ))}
      </nav>
    </footer>
  )
}
