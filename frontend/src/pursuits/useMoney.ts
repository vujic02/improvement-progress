import { useMemo } from 'react'
import { DEFAULT_CURRENCY, currencySymbol, formatMoney } from '../data/pursuits'
import { useSession } from '../session/context'

/**
 * Money in the signed-in account's currency. Anything that shows an amount
 * reads it through here, so switching currency on the profile relabels every
 * page at once.
 */
export function useMoney() {
  const { user } = useSession()
  const currency = user?.currency ?? DEFAULT_CURRENCY
  return useMemo(
    () => ({
      currency,
      symbol: currencySymbol(currency),
      format: (value: number) => formatMoney(value, currency),
    }),
    [currency],
  )
}
