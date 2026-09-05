import { createContext } from 'react'
import { usePursuitStore, type PursuitStore } from '../pursuits/context'

export const SavingsContext = createContext<PursuitStore | null>(null)

/** Savings, investments and dreams. */
export function useSavings(): PursuitStore {
  return usePursuitStore(SavingsContext, 'useSavings')
}
