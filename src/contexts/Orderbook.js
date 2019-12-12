import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { safeAccess } from '../utils'
import { useNocustClient, useEraNumber } from './Nocust'

// import { safeAccess } from '../utils'

const UPDATE = 'UPDATE'

export const OrderbookContext = createContext()

export function useOrderbookContext () {
  return useContext(OrderbookContext)
}

function reducer (state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { buyTokenAddress, sellTokenAddress, orderbook } = payload
      return {
        ...state,
        [buyTokenAddress]: {
          ...(safeAccess(state, [buyTokenAddress]) || {}),
          [sellTokenAddress]: orderbook.buy_orders
        },
        [sellTokenAddress]: {
          ...(safeAccess(state, [sellTokenAddress]) || {}),
          [buyTokenAddress]: orderbook.sell_orders
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in OrderbookContext reducer: '${type}'.`)
    }
  }
}

export default function Provider ({ web3, children }) {
  const [state, dispatch] = useReducer(reducer, {})

  const update = useCallback((buyTokenAddress, sellTokenAddress, orderbook) => {
    dispatch({ type: UPDATE, payload: { buyTokenAddress, sellTokenAddress, orderbook } })
  }, [])

  return (
    <OrderbookContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </OrderbookContext.Provider>
  )
}

export function useOrderbook (buyTokenAddress, sellTokenAddress) {
  const nocust = useNocustClient()
  const eraNumber = useEraNumber()
  const [state, { update }] = useOrderbookContext()
  const orders = safeAccess(state, [buyTokenAddress, sellTokenAddress]) || []

  useEffect(() => {
    if (nocust && buyTokenAddress && sellTokenAddress) {
      nocust.getOrderBook(buyTokenAddress, sellTokenAddress)
        .then(orders => {
          console.log('orders', orders)
          update(buyTokenAddress, sellTokenAddress, orders)
        })
        .catch(() => {
          update(buyTokenAddress, sellTokenAddress, {})
        })
    }
  }, [eraNumber, buyTokenAddress, sellTokenAddress, update])

  return orders
}
