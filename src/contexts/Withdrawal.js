import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'

import { safeAccess } from '../utils'
import { isAddress } from 'web3-utils'
import { useNocustClient, useEraNumber } from './Nocust'

const UPDATE = 'UPDATE'

const WithdrawalContext = createContext()

function useWithdrawalContext () {
  return useContext(WithdrawalContext)
}

function reducer (state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { address, tokenAddress, withdrawalLimit, blocksToWithdrawal, withdrawalFee } = payload
      return {
        ...state,
        withdrawalFee,
        [address]: {
          ...(safeAccess(state, [address]) || {}),
          [tokenAddress]: {
            withdrawalLimit,
            blocksToWithdrawal
          }
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in WithdrawalContext reducer: '${type}'.`)
    }
  }
}

export default function Provider ({ children }) {
  const [state, dispatch] = useReducer(reducer, {})

  const update = useCallback((address, tokenAddress, withdrawalLimit, blocksToWithdrawal, withdrawalFee) => {
    dispatch({ type: UPDATE, payload: { address, tokenAddress, withdrawalLimit, blocksToWithdrawal, withdrawalFee } })
  }, [])

  return (
    <WithdrawalContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </WithdrawalContext.Provider>
  )
}

export function useWithdrawalFee (gasPrice) {
  const nocust = useNocustClient()
  const [state, { update }] = useWithdrawalContext()
  const { withdrawalFee } = state
  // const { withdrawalLimit, blocksToWithdrawal } = safeAccess(state, []) || {}

  useEffect(() => {
    if (nocust) {
      let stale = false
      nocust.getWithdrawalFee(gasPrice)
        .then(withdrawalFee => {
          if (!stale) {
            update(null, null, null, null, withdrawalFee)
          }
        })
        .catch(() => {
          if (!stale) {
            update(null, null, null, null, null)
          }
        })
      return () => {
        stale = true
      }
    }
  }, [gasPrice, update])

  return withdrawalFee
}

export function useWithdrawalLimit (address, tokenAddress) {
  const nocust = useNocustClient()
  const eraNumber = useEraNumber()
  const [state, { update }] = useWithdrawalContext()
  const { withdrawalFee } = state
  const { withdrawalLimit, blocksToWithdrawal } = safeAccess(state, [address, tokenAddress]) || {}

  useEffect(() => {
    if (isAddress(address) && isAddress(tokenAddress)) {
      let stale = false
      console.log('checking withdrawal limit')
      nocust.getWithdrawalLimit(address, tokenAddress)
        .then(withdrawalLimit => {
          if (!stale) {
            update(address, tokenAddress, withdrawalLimit, blocksToWithdrawal, withdrawalFee)
          }
        })
        .catch(() => {
          if (!stale) {
            update(address, tokenAddress, null, blocksToWithdrawal, withdrawalFee)
          }
        })
      return () => {
        stale = true
      }
    }
  }, [address, tokenAddress, eraNumber, update])

  return withdrawalLimit
}

export function useBlocksToWithdrawal (address, tokenAddress) {
  const nocust = useNocustClient()
  const [state, { update }] = useWithdrawalContext()
  const { withdrawalFee } = state
  const { withdrawalLimit, blocksToWithdrawal } = safeAccess(state, [address, tokenAddress]) || {}

  useEffect(() => {
    if (isAddress(address) && isAddress(tokenAddress)) {
      let stale = false
      nocust.getBlocksToWithdrawalConfirmation(address, undefined, tokenAddress)
        .then(blocksToWithdrawal => {
          if (!stale) {
            update(address, tokenAddress, withdrawalLimit, blocksToWithdrawal, withdrawalFee)
          }
        })
        .catch(() => {
          if (!stale) {
            update(address, tokenAddress, withdrawalLimit, null, withdrawalFee)
          }
        })
      return () => {
        stale = true
      }
    }
  }, [address, tokenAddress, blocksToWithdrawal, update])

  return blocksToWithdrawal
}
