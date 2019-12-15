import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'

import { NOCUSTManager } from 'nocust-client'

const HUB_CONTRACT_ADDRESS = process.env.REACT_APP_HUB_CONTRACT_ADDRESS
const HUB_API_URL = process.env.REACT_APP_HUB_API_URL

const INITIAL_HUB_INFO = {
  hubContract: HUB_CONTRACT_ADDRESS,
  hubApiUrl: HUB_API_URL
}

const UPDATE_ERA = 'UPDATE_ERA'
const UPDATE_NOCUST = 'UPDATE_NOCUST'
const UPDATE_RECOVERY = 'UPDATE_RECOVERY'
const UPDATE_SLA = 'UPDATE_SLA'

export const NocustContext = createContext()

export function useNocustContext () {
  return useContext(NocustContext)
}

function reducer (state, { type, payload }) {
  switch (type) {
    case UPDATE_NOCUST: {
      const { nocust } = payload
      return {
        ...state,
        nocust
      }
    }
    case UPDATE_ERA: {
      const { eraNumber } = payload
      return {
        ...state,
        eraNumber
      }
    }
    case UPDATE_RECOVERY: {
      const { isRecovery } = payload
      return {
        ...state,
        isRecovery
      }
    }
    case UPDATE_SLA: {
      const { slaDetail } = payload
      return {
        ...state,
        slaDetail
      }
    }
    default: {
      throw Error(`Unexpected action type in NocustContext reducer: '${type}'.`)
    }
  }
}

export default function Provider ({ web3, children }) {
  const [state, dispatch] = useReducer(reducer, { web3: web3, hub: INITIAL_HUB_INFO })

  const updateNocust = useCallback((nocust) => {
    dispatch({ type: UPDATE_NOCUST, payload: { nocust } })
  }, [])

  const updateEra = useCallback((eraNumber) => {
    dispatch({ type: UPDATE_ERA, payload: { eraNumber } })
  }, [])

  const updateIsRecovery = useCallback((isRecovery) => {
    dispatch({ type: UPDATE_RECOVERY, payload: { isRecovery } })
  }, [])

  const updateSlaDetail = useCallback((isRecovery) => {
    dispatch({ type: UPDATE_SLA, payload: { isRecovery } })
  }, [])

  // Poll the hub to keep track of the Era number
  // Can then use it as a clock to avoid excessive requests to hub
  useEffect(() => {
    const test = () => {
      const { nocust } = state
      if (nocust) {
        console.log('Checking Era')
        nocust.getEraNumber()
          .then(eraNumber => {
            console.log('Era:', eraNumber)
            updateEra(eraNumber)
          })
          .catch(() => {
            console.log('setting eraNumber to null')
            updateEra(null)
          })
      }
    }

    test()
    const intervalId = setInterval(test, 10000)
    return () => { clearInterval(intervalId) }
  }, [state.nocust])

  return (
    <NocustContext.Provider value={useMemo(() => [state, { updateNocust, updateEra, updateIsRecovery, updateSlaDetail }], [state, updateNocust, updateEra, updateIsRecovery, updateSlaDetail])}>
      {children}
    </NocustContext.Provider>
  )
}

export function useNocustHubInfo () {
  const [state] = useNocustContext()
  const { hub } = state

  return hub
}

export function getBlocksPerEon () {
  const [state, { updateBlocksPerEon }] = useNocustContext()
  const { nocust, blocksPerEon } = state

  useEffect(() => {
    if (nocust) {
      nocust.getBlocksPerEon()
        .then((blocksPerEon) => updateBlocksPerEon(blocksPerEon))
        .catch(() => updateBlocksPerEon(null))
    }
  }, [nocust])
  console.log(state)

  return blocksPerEon
}

export function useNocustClient () {
  const [state, { updateNocust }] = useNocustContext()
  const { web3, nocust } = state

  useEffect(() => {
    if (web3 && !nocust) {
      try {
        const nocustManager = new NOCUSTManager({
          rpcApi: web3,
          operatorApiUrl: HUB_API_URL,
          contractAddress: HUB_CONTRACT_ADDRESS
        })

        console.log('new nocust-client')
        updateNocust(nocustManager)
      } catch (e) {
        updateNocust(null)
      }
    }
  })

  return nocust
}

export function useIsRecovery () {
  const [state, { updateIsRecovery }] = useNocustContext()
  const { nocust, isRecovery, eraNumber } = state

  useEffect(() => {
    if (nocust) {
      nocust.isRecovery()
        .then(isRecovery => updateIsRecovery(isRecovery))
        .catch(() => updateIsRecovery(false))
    }
  }, [eraNumber])

  return isRecovery
}

export function useEraNumber () {
  const [state] = useNocustContext()
  const { eraNumber } = state

  return eraNumber
}

export function useSlaDetail (address) {
  const [state, { updateSlaDetail }] = useNocustContext()
  const { nocust, eraNumber, slaDetail } = state

  useEffect(() => {
    if (nocust) {
      nocust.getSLADetail()
        .then((slaDetail) => updateSlaDetail(slaDetail))
        .catch((slaDetail) => updateSlaDetail({}))
    }
  }, [address, eraNumber])

  return slaDetail
}
