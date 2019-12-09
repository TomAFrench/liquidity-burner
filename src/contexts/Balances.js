import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'

import { safeAccess } from '../utils'
import { isAddress, toBN, fromWei } from 'web3-utils'
import { useNocustClient } from './Nocust'

const UPDATE = 'UPDATE'

const BalanceContext = createContext()

function useBalanceContext () {
  return useContext(BalanceContext)
}

function reducer (state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { address, tokenAddress, onchainBalance, offchainBalance } = payload
      return {
        ...state,
        [address]: {
          ...(safeAccess(state, [address]) || {}),
          [tokenAddress]: {
            ...(safeAccess(state, [address, tokenAddress]) || {}),
            onchainBalance,
            offchainBalance
          }
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in BalancesContext reducer: '${type}'.`)
    }
  }
}

export default function Provider ({ children }) {
  const [state, dispatch] = useReducer(reducer, {})

  const update = useCallback((address, tokenAddress, onchainBalance, offchainBalance) => {
    dispatch({ type: UPDATE, payload: { address, tokenAddress, onchainBalance, offchainBalance } })
  }, [])

  return (
    <BalanceContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </BalanceContext.Provider>
  )
}

export function useOffchainAddressBalance (address, tokenAddress) {
  const nocust = useNocustClient()
  const [state, { update }] = useBalanceContext()
  const { onchainBalance, offchainBalance } = safeAccess(state, [address, tokenAddress]) || {}

  useEffect(() => {
    if (
      isAddress(address) &&
      isAddress(tokenAddress) &&
      offchainBalance === undefined &&
      nocust
    ) {
      let stale = false
      nocust.getNOCUSTBalance(address, tokenAddress)
        .then(offchainBalance => {
          if (!stale) {
            update(address, tokenAddress, onchainBalance, offchainBalance)
          }
        })
        .catch(() => {
          if (!stale) {
            update(address, tokenAddress, onchainBalance, null)
          }
        })
      return () => {
        stale = true
      }
    }
  }, [address, tokenAddress, offchainBalance, update])

  return offchainBalance
}

export function useOnchainAddressBalance (address, tokenAddress) {
  const nocust = useNocustClient()
  const [state, { update }] = useBalanceContext()
  const { onchainBalance, offchainBalance } = safeAccess(state, [address, tokenAddress]) || {}

  useEffect(() => {
    if (
      isAddress(address) &&
      isAddress(tokenAddress) &&
      onchainBalance === undefined &&
      nocust
    ) {
      let stale = false
      nocust.getOnChainBalance(address, tokenAddress)
        .then(onchainBalance => {
          if (!stale) {
            update(address, tokenAddress, onchainBalance, offchainBalance)
          }
        })
        .catch(() => {
          if (!stale) {
            update(address, tokenAddress, null, offchainBalance)
          }
        })
      return () => {
        stale = true
      }
    }
  }, [address, tokenAddress, onchainBalance, update])

  return onchainBalance
}

export function getDisplayValue (value, decimals = 4) {
  const displayVal = fromWei(value.toString(), 'ether')
  if (displayVal.indexOf('.') >= 0) {
    if (displayVal.charAt(0) === '0') {
      return displayVal.substr(0, displayVal.search(/[1-9]/) + decimals + 1)
    } else {
      return displayVal.substr(0, displayVal.indexOf('.') + decimals + 1)
    }
  }
  return displayVal
}

export function useAddressBalance (address, tokenAddress) {
  const onchainBalance = useOnchainAddressBalance(address, tokenAddress)
  const offchainBalance = useOffchainAddressBalance(address, tokenAddress)

  let displayOnchain
  if (typeof onchainBalance !== 'undefined') {
    displayOnchain = getDisplayValue(toBN(onchainBalance))
  }

  let displayOffchain
  if (typeof offchainBalance !== 'undefined') {
    displayOffchain = getDisplayValue(toBN(offchainBalance))
  }

  return { onchainBalance, offchainBalance, displayOnchain, displayOffchain }
}

export function useAllTokenBalances (address) {
  const [state] = useBalanceContext()
  const tokenDetails = safeAccess(state, [address]) || {}
  return tokenDetails
}
