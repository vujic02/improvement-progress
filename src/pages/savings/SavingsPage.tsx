import { SAVINGS_AREA } from '../../data/savings'
import { SavingsContext } from '../../savings/context'
import { PursuitPage } from '../pursuits/PursuitPage'

export function SavingsPage() {
  return <PursuitPage area={SAVINGS_AREA} context={SavingsContext} hookName="useSavings" />
}
