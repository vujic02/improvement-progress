import { createContext } from 'react'
import { usePursuitStore, type PursuitStore } from '../pursuits/context'

export const DreamsContext = createContext<PursuitStore | null>(null)

/** Big goals and dreams — no kinds, an icon and an optional picture. */
export function useDreams(): PursuitStore {
  return usePursuitStore(DreamsContext, 'useDreams')
}
