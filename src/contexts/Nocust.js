import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'

// import { safeAccess } from '../utils'

import { NOCUSTManager } from 'nocust-client'

import ethImg from '../images/ethereum.png'
import daiImg from '../images/dai.jpg'
import lqdImg from '../images/liquidity.png'

const HUB_CONTRACT_ADDRESS = process.env.REACT_APP_HUB_CONTRACT_ADDRESS
const HUB_API_URL = process.env.REACT_APP_HUB_API_URL

const INITIAL_TOKENS = {
  ETH: {},
  DAI: {},
  LQD: {}
}

const UPDATE = 'UPDATE'

export const NocustContext = createContext()

export function useNocustContext () {
  return useContext(NocustContext)
}

function reducer (state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { web3, nocust, tokens } = payload
      return {
        ...state,
        web3,
        nocust,
        tokens
      }
    }
    default: {
      throw Error(`Unexpected action type in NocustContext reducer: '${type}'.`)
    }
  }
}

export default function Provider ({ web3, children }) {
  const [state, dispatch] = useReducer(reducer, { web3: web3, tokens: INITIAL_TOKENS })

  const update = useCallback((web3, nocust, tokens) => {
    dispatch({ type: UPDATE, payload: { web3, nocust, tokens } })
  }, [])

  return (
    <NocustContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </NocustContext.Provider>
  )
}

async function registerToken (nocust, address, tokenAddress) {
  console.log('Registering token:', tokenAddress)
  try {
    return nocust.registerAddress(address, tokenAddress)
  } catch (e) {
    console.log('Error registering', e)
  }
}

export function useNocustClient (address) {
  const [state, { update }] = useNocustContext()
  const { web3, nocust, tokens } = state

  useEffect(() => {
    if (web3) {
      let stale = false

      const nocustManager = new NOCUSTManager({
        rpcApi: web3,
        operatorApiUrl: HUB_API_URL,
        contractAddress: HUB_CONTRACT_ADDRESS
      })

      if (tokens) {
        Promise.all(Object.values(tokens).map(async (token) => {
          if (token.tokenAddress) {
            const registered = await nocustManager.isAddressRegistered(address, token.tokenAddress)
            if (!registered) {
              console.log('Registering with hub')
              return registerToken(nocustManager, address, token.tokenAddress)
            }
            return true
          }
          return undefined
        }
        ))
      }

      if (!stale) {
        try {
          update(web3, nocustManager, tokens)
        } catch (e) {
          update(web3, null, tokens)
        }
      }

      return () => {
        stale = true
      }
    }
  }, [web3, update])

  return nocust
}

function buildTokenDict (tokenList) {
  var tokens = tokenList.reduce((accumulator, pilot) => {
    return { ...accumulator, [pilot.shortName]: { name: pilot.name, shortName: pilot.shortName, tokenAddress: pilot.tokenAddress } }
  }, {})

  if (tokens.ETH) tokens.ETH.image = ethImg
  if (tokens.DAI) tokens.DAI.image = daiImg
  if (tokens.LQD) tokens.LQD.image = lqdImg

  return tokens
}

export function useTokens () {
  const [state, { update }] = useNocustContext()
  const { web3, nocust, tokens } = state

  useEffect(() => {
    if (web3 && nocust) {
      let stale = false

      nocust.getSupportedTokens()
        .then(tokenList => {
          const tokens = buildTokenDict(tokenList)
          if (!stale) {
            update(web3, nocust, tokens)
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
  }, [web3, nocust, update])

  return tokens
}

export function isValidToken (tokens, tokenShortName) {
  return Object.keys(tokens).includes(tokenShortName)
}

export function lookupTokenAddress (tokens, tokenAddress) {
  return Object.values(tokens).find((token) => {
    return tokenAddress === token.tokenAddress
  })
}
