import { useEffect, useState } from 'react'

export const ROUTES = ['welcome', 'signin', 'register', 'boot', 'dashboard'] as const

export type Route = (typeof ROUTES)[number]

const PATHS: Record<Route, string> = {
  welcome: '#/',
  signin: '#/signin',
  register: '#/register',
  boot: '#/boot',
  dashboard: '#/dashboard',
}

function readRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  if (hash === '') return 'welcome'
  return (ROUTES as readonly string[]).includes(hash) ? (hash as Route) : 'welcome'
}

/** Jump to a route. Pushes history so the back button works. */
export function navigate(route: Route) {
  if (window.location.hash !== PATHS[route]) window.location.hash = PATHS[route]
}

export function hrefFor(route: Route): string {
  return PATHS[route]
}

/**
 * Minimal hash router. Hash-based so the app also works when served from a
 * static host with no rewrite rules — swap for a real router if this grows.
 */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(readRoute)

  useEffect(() => {
    const onChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}
