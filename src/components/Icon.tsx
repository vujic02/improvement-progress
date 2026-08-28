import type { CSSProperties, ReactNode } from 'react'

type Mode = 'stroke' | 'fill'

interface Glyph {
  mode: Mode
  el: ReactNode
}

/**
 * One flat icon set for the whole app. Icons inherit `currentColor`, so tint
 * them from the parent (`color`) rather than passing a fill per call site.
 */
const GLYPHS = {
  home: {
    mode: 'stroke',
    el: (
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V20h5v-5.5h3V20h5V9.5" />
      </>
    ),
  },
  wallet: {
    mode: 'stroke',
    el: (
      <>
        <rect x="2.5" y="5.5" width="19" height="13" rx="3" />
        <path d="M21.5 9.5H16.5a2.5 2.5 0 0 0 0 5h5" />
      </>
    ),
  },
  rocket: {
    mode: 'stroke',
    el: (
      <>
        <path d="M12 2.5c2.8 2.4 4.2 5.6 4.2 9.1l-1.7 3.4h-5L7.8 11.6C7.8 8.1 9.2 4.9 12 2.5Z" />
        <circle cx="12" cy="9.5" r="1.7" />
        <path d="M7.8 11.6 5.5 14v3.6l2.9-1.9" />
        <path d="M16.2 11.6 18.5 14v3.6l-2.9-1.9" />
        <path d="M10.4 18.4c0 1.2.6 2.4 1.6 3.1 1-.7 1.6-1.9 1.6-3.1" />
      </>
    ),
  },
  cube: {
    mode: 'stroke',
    el: (
      <>
        <path d="M12 2.8 20.5 7v10L12 21.2 3.5 17V7Z" />
        <path d="M3.5 7 12 11.5 20.5 7" />
        <path d="M12 11.5v9.7" />
      </>
    ),
  },
  documents: {
    mode: 'stroke',
    el: (
      <>
        <path d="M9.5 2.5h5L19 7v11.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 8 18.5V4a1.5 1.5 0 0 1 1.5-1.5Z" />
        <path d="M14 2.5V7.5H19" />
        <path d="M5.5 6.5A1.5 1.5 0 0 0 4.5 8v11.5A2 2 0 0 0 6.5 21.5h8" />
      </>
    ),
  },
  documentText: {
    mode: 'stroke',
    el: (
      <>
        <path d="M8 2.5h5.5L19 8v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2Z" />
        <path d="M13.5 2.5V8H19" />
        <path d="M9 13h7M9 16.5h5" />
      </>
    ),
  },
  person: {
    mode: 'stroke',
    el: (
      <>
        <circle cx="12" cy="8" r="3.8" />
        <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
      </>
    ),
  },
  key: {
    mode: 'stroke',
    el: (
      <>
        <circle cx="7.5" cy="12" r="3.5" />
        <path d="M11 12h9.5M17.5 12v3.5M14.5 12v2.5" />
      </>
    ),
  },
  build: {
    mode: 'stroke',
    el: (
      <path d="M20.3 4.7a5 5 0 0 1-6.6 6.6L5.9 19.1a2 2 0 1 1-2.8-2.8l7.8-7.8a5 5 0 0 1 6.6-6.6l-3.2 3.2 2.8 2.8Z" />
    ),
  },
  statsChart: {
    mode: 'stroke',
    el: (
      <>
        <rect x="3.5" y="12.5" width="4" height="8" rx="1" />
        <rect x="10" y="7.5" width="4" height="13" rx="1" />
        <rect x="16.5" y="3.5" width="4" height="17" rx="1" />
      </>
    ),
  },
  checkmarkCircle: {
    mode: 'stroke',
    el: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12.3 2.8 2.8 5.4-5.4" />
      </>
    ),
  },
  tagFaces: {
    mode: 'stroke',
    el: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="9.2" cy="10.2" r="1" fill="currentColor" stroke="none" />
        <circle cx="14.8" cy="10.2" r="1" fill="currentColor" stroke="none" />
        <path d="M8.2 14.4a4.6 4.6 0 0 0 7.6 0" />
      </>
    ),
  },
  bell: {
    mode: 'stroke',
    el: (
      <>
        <path d="M18 16.5V11a6 6 0 1 0-12 0v5.5L4.5 18.5h15Z" />
        <path d="M10 21a2.2 2.2 0 0 0 4 0" />
      </>
    ),
  },
  settings: {
    mode: 'stroke',
    el: (
      <>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" />
      </>
    ),
  },
  search: {
    mode: 'stroke',
    el: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 4.5 4.5" />
      </>
    ),
  },
  clock: {
    mode: 'stroke',
    el: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6.8V12l3.6 2.2" />
      </>
    ),
  },
  moreHoriz: {
    mode: 'fill',
    el: (
      <>
        <circle cx="5.5" cy="12" r="1.8" />
        <circle cx="12" cy="12" r="1.8" />
        <circle cx="18.5" cy="12" r="1.8" />
      </>
    ),
  },
  apple: {
    mode: 'fill',
    el: (
      <>
        <path d="M17.05 12.53c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.19-1.72-1.36-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.87-.76-1.48.02-2.84.86-3.6 2.18-1.53 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.25 2.74 2.2 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.08 2.65-2.14.84-1.23 1.18-2.42 1.2-2.48-.03-.01-2.29-.88-2.31-3.51Z" />
        <path d="M14.9 6.1c.6-.74 1.02-1.76.9-2.78-.87.04-1.93.58-2.56 1.31-.56.65-1.06 1.7-.93 2.7.98.08 1.98-.5 2.59-1.23Z" />
      </>
    ),
  },
} as const satisfies Record<string, Glyph>

/** Google's mark keeps its brand colours, so it opts out of currentColor. */
const GOOGLE = (
  <>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
    />
  </>
)

export type IconName = keyof typeof GLYPHS | 'google'

export interface IconProps {
  name: IconName
  /** px, applied to both axes */
  size?: number
  className?: string
  style?: CSSProperties
  /** Set when the icon carries meaning on its own; otherwise it stays hidden. */
  title?: string
}

export function Icon({ name, size = 20, className, style, title }: IconProps) {
  const isGoogle = name === 'google'
  const glyph: Glyph | undefined = isGoogle ? undefined : GLYPHS[name]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={{ flexShrink: 0, display: 'block', ...style }}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill={glyph?.mode === 'fill' ? 'currentColor' : 'none'}
      stroke={glyph?.mode === 'stroke' ? 'currentColor' : 'none'}
      strokeWidth={glyph?.mode === 'stroke' ? 1.9 : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {title ? <title>{title}</title> : null}
      {isGoogle ? GOOGLE : glyph?.el}
    </svg>
  )
}
