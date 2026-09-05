import { GROWTH_AREA } from '../../data/growth'
import { GrowthContext } from '../../growth/context'
import { PursuitPage } from '../pursuits/PursuitPage'

export function GrowthPage() {
  return <PursuitPage area={GROWTH_AREA} context={GrowthContext} hookName="useGrowth" />
}
