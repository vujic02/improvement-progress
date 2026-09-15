import { useEffect, useState } from 'react'

export const ROUTES = [
  'welcome',
  'signin',
  'register',
  'boot',
  'dashboard',
  'savings',
  'self-improvement',
  'dreams',
  'task-types',
  'profile',
] as const

export type Route = (typeof ROUTES)[number]

const PATHS: Record<Route, string> = {
  welcome: '#/',
  signin: '#/signin',
  register: '#/register',
  boot: '#/boot',
  dashboard: '#/dashboard',
  savings: '#/savings',
  'self-improvement': '#/self-improvement',
  dreams: '#/dreams',
  'task-types': '#/task-types',
  profile: '#/profile',
}

function readRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  if (hash === '') return 'welcome'
  return (ROUTES as readonly string[]).includes(hash) ? (hash as Route) : 'welcome'
}

/**
 * Jump to a route. Pushes history so the back button works; `replace` swaps
 * the current entry instead, for redirects the back button should not land on.
 */
export function navigate(route: Route, { replace = false }: { replace?: boolean } = {}) {
  const path = PATHS[route]
  if (window.location.hash === path) return
  if (replace) window.location.replace(path)
  else window.location.hash = path
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
