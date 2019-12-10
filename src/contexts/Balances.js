import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'

import { safeAccess } from '../utils'
import { isAddress, fromWei } from 'web3-utils'
import { useNocustClient, useEraNumber } from './Nocust'

const UPDATE = 'UPDATE'
const UPDATE_ONCHAIN = 'UPDATE_ONCHAIN'
const UPDATE_OFFCHAIN = 'UPDATE_OFFCHAIN'

const BalanceContext = createContext()

function useBalanceContext () {
  return useContext(BalanceContext)
}

function reducer (state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { address, tokenAddress, tokenBalance } = payload
      return {
        ...state,
        [address]: {
          ...(safeAccess(state, [address]) || {}),
          [tokenAddress]: tokenBalance
        }
      }
    }
    case UPDATE_ONCHAIN: {
      const { address, tokenAddress, onchainBalance } = payload
      return {
        ...state,
        [address]: {
          ...(safeAccess(state, [address]) || {}),
          [tokenAddress]: {
            ...(safeAccess(state, [address, tokenAddress]) || {}),
            onchainBalance
          }
        }
      }
    }
    case UPDATE_OFFCHAIN: {
      const { address, tokenAddress, offchainBalance } = payload
      return {
        ...state,
        [address]: {
          ...(safeAccess(state, [address]) || {}),
          [tokenAddress]: {
            ...(safeAccess(state, [address, tokenAddress]) || {}),
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

  const update = useCallback((address, tokenAddress, tokenBalance) => {
    dispatch({ type: UPDATE, payload: { address, tokenAddress, tokenBalance } })
  }, [])

  const updateOnchain = useCallback((address, tokenAddress, onchainBalance) => {
    dispatch({ type: UPDATE_ONCHAIN, payload: { address, tokenAddress, onchainBalance } })
  }, [])

  const updateOffchain = useCallback((address, tokenAddress, offchainBalance) => {
    dispatch({ type: UPDATE_OFFCHAIN, payload: { address, tokenAddress, offchainBalance } })
  }, [])

  return (
    <BalanceContext.Provider value={useMemo(() => [state, { update, updateOnchain, updateOffchain }], [state, update, updateOnchain, updateOffchain])}>
      {children}
    </BalanceContext.Provider>
  )
}

export function useOffchainAddressBalance (address, tokenAddress) {
  const nocust = useNocustClient()
  const eraNumber = useEraNumber()

  const [state, { updateOffchain }] = useBalanceContext()
  const { offchainBalance } = safeAccess(state, [address, tokenAddress]) || {}

  useEffect(() => {
    if (
      isAddress(address) &&
      isAddress(tokenAddress) &&
      nocust
    ) {
      let stale = false
      nocust.getNOCUSTBalance(address, tokenAddress)
        .then(offchainBalance => {
          if (!stale) {
            updateOffchain(address, tokenAddress, offchainBalance)
          }
        })
        .catch(() => {
          if (!stale) {
            updateOffchain(address, tokenAddress, null)
          }
        })
      return () => {
        stale = true
      }
    }
  }, [address, tokenAddress, eraNumber])

  return offchainBalance
}

export function useOnchainAddressBalance (address, tokenAddress) {
  const nocust = useNocustClient()
  const eraNumber = useEraNumber()

  const [state, { updateOnchain }] = useBalanceContext()
  const { onchainBalance } = safeAccess(state, [address, tokenAddress]) || {}

  useEffect(() => {
    if (
      isAddress(address) &&
      isAddress(tokenAddress) &&
      nocust
    ) {
      let stale = false
      nocust.getOnChainBalance(address, tokenAddress)
        .then(onchainBalance => {
          if (!stale) {
            updateOnchain(address, tokenAddress, onchainBalance)
          }
        })
        .catch(() => {
          if (!stale) {
            updateOnchain(address, tokenAddress, null)
          }
        })
      return () => {
        stale = true
      }
    }
  }, [address, tokenAddress, eraNumber])

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
  const nocust = useNocustClient()
  const eraNumber = useEraNumber()
  const [state, { update }] = useBalanceContext()
  const tokenBalance = safeAccess(state, [address, tokenAddress]) || {}

  const getData = async () => {
    if (!!nocust && !!address && !!tokenAddress) {
      console.log('getting balances for', tokenAddress)
      const onchainBalance = await nocust.getOnChainBalance(address, tokenAddress)
      const offchainBalance = await nocust.getNOCUSTBalance(address, tokenAddress)

      update(address, tokenAddress, { onchainBalance, offchainBalance })
    }
  }

  useMemo(getData, [eraNumber])

  return tokenBalance
}

export function useAllTokenBalances (address) {
  const [state] = useBalanceContext()
  const tokenDetails = safeAccess(state, [address]) || {}
  return tokenDetails
}
