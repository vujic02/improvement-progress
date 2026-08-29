import { createContext } from 'react'
import { usePursuitStore, type PursuitStore } from '../pursuits/context'

export const GrowthContext = createContext<PursuitStore | null>(null)

/** Self-improvement goals — learning, training, nutrition, reading, mindset. */
export function useGrowth(): PursuitStore {
  return usePursuitStore(GrowthContext, 'useGrowth')
}
