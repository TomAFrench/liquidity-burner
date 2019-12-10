import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'

import { safeAccess } from '../utils'
import { isAddress } from 'web3-utils'
import { useNocustClient } from './Nocust'

const UPDATE = 'UPDATE'

const TransactionContext = createContext()

function useTransactionContext () {
  return useContext(TransactionContext)
}

function reducer (state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { address, tokenAddress, transactions } = payload
      return {
        ...state,
        [address]: {
          ...(safeAccess(state, [address]) || {}),
          [tokenAddress]: {
            transactions
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

  const update = useCallback((address, tokenAddress, transactions) => {
    dispatch({ type: UPDATE, payload: { address, tokenAddress, transactions } })
  }, [])

  return (
    <TransactionContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </TransactionContext.Provider>
  )
}

export function useTokenTransactions (address, tokenAddress) {
  const nocust = useNocustClient()
  const [state, { update }] = useTransactionContext()
  const { transactions } = safeAccess(state, [address, tokenAddress]) || {}

  useEffect(() => {
    if (isAddress(address) && isAddress(tokenAddress)) {
      let stale = false
      console.log('checking transactions')
      nocust.getTransactionsForAddress(address, tokenAddress)
        .then(transactions => {
          if (transactions.length) {
            transactions = transactions.reverse()
          }
          if (!stale) {
            update(address, tokenAddress, transactions)
          }
        })
        .catch(() => {
          if (!stale) {
            update(address, tokenAddress, null)
          }
        })
      return () => {
        stale = true
      }
    }
  }, [address, tokenAddress, update])

  return transactions
}
