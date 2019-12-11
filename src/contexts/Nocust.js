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
  const [state] = useNocustContext()
  const { hub } = state

  return hub
}

export function useNocustClient () {
  const [state, { update }] = useNocustContext()
  const { web3, nocust, eraNumber } = state

  useEffect(() => {
    if (web3 && !nocust) {
      let stale = false

      const nocustManager = new NOCUSTManager({
        rpcApi: web3,
        operatorApiUrl: HUB_API_URL,
        contractAddress: HUB_CONTRACT_ADDRESS
      })

      console.log('new nocust-client')

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
  })

  return nocust
}

export function useEraNumber () {
  const [state, { update }] = useNocustContext()
  const { web3, nocust, eraNumber } = state

  useEffect(() => {
    if (web3 && nocust) {
      let stale = false
      console.log('Checking Era')
      nocust.getEraNumber()
        .then(neweraNumber => {
          if (!stale && (eraNumber === undefined || eraNumber < neweraNumber)) {
            console.log('Era:', neweraNumber)
            update(web3, nocust, neweraNumber)
          }
        })
        .catch(() => {
          if (!stale) {
            console.log('setting eraNumber to null')
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
