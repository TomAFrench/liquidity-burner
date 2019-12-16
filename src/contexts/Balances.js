import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'

import { safeAccess } from '../utils'
import { isAddress, fromWei } from 'web3-utils'
import { useNocustClient, useEraNumber } from './Nocust'
import { toBigNumber } from 'nocust-client'

const UPDATE = 'UPDATE'
const UPDATE_ONCHAIN = 'UPDATE_ONCHAIN'
const UPDATE_OFFCHAIN = 'UPDATE_OFFCHAIN'

const ZERO_BALANCE = { offchainBalance: toBigNumber('0'), onchainBalance: toBigNumber('0') }

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
  const { offchainBalance } = safeAccess(state, [address, tokenAddress]) || ZERO_BALANCE

  useEffect(() => {
    if (
      isAddress(address) &&
      isAddress(tokenAddress) &&
      nocust
    ) {
      console.log('Getting offchain balance')
      nocust.getNOCUSTBalance(address, tokenAddress)
        .then(offchainBalance => {
          updateOffchain(address, tokenAddress, offchainBalance)
        })
        .catch(() => {
          updateOffchain(address, tokenAddress, ZERO_BALANCE.offchainBalance)
        })
    }
  }, [address, tokenAddress, eraNumber])

  return offchainBalance
}

export function useOnchainAddressBalance (address, tokenAddress) {
  const nocust = useNocustClient()
  const eraNumber = useEraNumber()

  const [state, { updateOnchain }] = useBalanceContext()
  const { onchainBalance } = safeAccess(state, [address, tokenAddress]) || ZERO_BALANCE

  useEffect(() => {
    if (
      isAddress(address) &&
      isAddress(tokenAddress) &&
      nocust
    ) {
      console.log('Getting onchain balance')
      nocust.getOnChainBalance(address, tokenAddress)
        .then(onchainBalance => {
          updateOnchain(address, tokenAddress, onchainBalance)
        })
        .catch(() => {
          updateOnchain(address, tokenAddress, ZERO_BALANCE.onchainBalance)
        })
    }
  }, [address, tokenAddress, eraNumber])

  return onchainBalance
}

export function getDisplayValue (value, decimals = 4) {
  const displayVal = fromWei(value.toString(10), 'ether')
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
  const tokenBalance = safeAccess(state, [address, tokenAddress]) || ZERO_BALANCE

  useEffect(() => {
    console.log('getting balances for', tokenAddress)
    if (!!nocust && !!address && !!tokenAddress) {
      Promise.all([
        nocust.getOnChainBalance(address, tokenAddress),
        nocust.getNOCUSTBalance(address, tokenAddress)])
        .then(([onchainBalance, offchainBalance]) => {
          update(address, tokenAddress, { onchainBalance, offchainBalance })
        })
        .catch(err => {
          console.error(err)
          update(address, tokenAddress, ZERO_BALANCE)
        })
    }
  }, [address, tokenAddress, eraNumber])

  return tokenBalance
}

export function useAllTokenBalances (address) {
  const [state] = useBalanceContext()
  const tokenDetails = safeAccess(state, [address]) || {}
  return tokenDetails
}
