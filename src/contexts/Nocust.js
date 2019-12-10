import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'

// import { safeAccess } from '../utils'

import { NOCUSTManager } from 'nocust-client'

const HUB_CONTRACT_ADDRESS = process.env.REACT_APP_HUB_CONTRACT_ADDRESS
const HUB_API_URL = process.env.REACT_APP_HUB_API_URL

const INITIAL_HUB_INFO = {
  hubContract: HUB_CONTRACT_ADDRESS,
  hubApiUrl: HUB_API_URL
}

const UPDATE = 'UPDATE'

export const NocustContext = createContext()

export function useNocustContext () {
  return useContext(NocustContext)
}

function reducer (state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { web3, nocust, eraNumber } = payload
      return {
        ...state,
        web3,
        nocust,
        eraNumber
      }
    }
    default: {
      throw Error(`Unexpected action type in NocustContext reducer: '${type}'.`)
    }
  }
}

export default function Provider ({ web3, children }) {
  const [state, dispatch] = useReducer(reducer, { web3: web3, hub: INITIAL_HUB_INFO })

  const update = useCallback((web3, nocust, eraNumber) => {
    dispatch({ type: UPDATE, payload: { web3, nocust, eraNumber } })
  }, [])

  return (
    <NocustContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </NocustContext.Provider>
  )
}

export function useNocustHubInfo () {
  const [state, { update }] = useNocustContext()
  const { hub } = state

  return hub
}

export function useNocustClient (address) {
  const [state, { update }] = useNocustContext()
  const { web3, nocust, eraNumber } = state

  useEffect(() => {
    if (web3) {
      let stale = false

      const nocustManager = new NOCUSTManager({
        rpcApi: web3,
        operatorApiUrl: HUB_API_URL,
        contractAddress: HUB_CONTRACT_ADDRESS
      })

      // if (tokens) {
      //   Promise.all(Object.values(tokens).map(async (token) => {
      //     if (token.tokenAddress) {
      //       const registered = await nocustManager.isAddressRegistered(address, token.tokenAddress)
      //       if (!registered) {
      //         console.log('Registering with hub')
      //         return registerToken(nocustManager, address, token.tokenAddress)
      //       }
      //       return true
      //     }
      //     return undefined
      //   }
      //   ))
      // }

      if (!stale) {
        try {
          update(web3, nocustManager, eraNumber)
        } catch (e) {
          update(web3, null, eraNumber)
        }
      }

      return () => {
        stale = true
      }
    }
  }, [web3, update])

  return nocust
}

export function useEraNumber () {
  const [state, { update }] = useNocustContext()
  const { web3, nocust, eraNumber } = state

  useEffect(() => {
    if (web3 && nocust) {
      let stale = false
      nocust.getEraNumber()
        .then(eraNumber => {
          if (!stale) {
            update(web3, nocust, eraNumber)
          }
        })
        .catch(() => {
          if (!stale) {
            update(web3, nocust, null)
          }
        })

      return () => {
        stale = true
      }
    }
  })

  return eraNumber
}
