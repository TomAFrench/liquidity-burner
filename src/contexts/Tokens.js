import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'

import { useNocustClient, useEraNumber } from './Nocust'

import ethImg from '../images/ethereum.png'
import daiImg from '../images/dai.jpg'
import lqdImg from '../images/liquidity.png'

const UPDATE = 'UPDATE'

export const TokensContext = createContext()

export function useTokensContext () {
  return useContext(TokensContext)
}

function reducer (state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { tokens } = payload
      return {
        ...state,
        tokens
      }
    }
    default: {
      throw Error(`Unexpected action type in TokensContext reducer: '${type}'.`)
    }
  }
}

export default function Provider ({ children }) {
  const [state, dispatch] = useReducer(reducer, {})

  const update = useCallback((tokens) => {
    dispatch({ type: UPDATE, payload: { tokens } })
  }, [])

  return (
    <TokensContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </TokensContext.Provider>
  )
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
  const nocust = useNocustClient()
  const eraNumber = useEraNumber()
  const [state, { update }] = useTokensContext()
  const { tokens } = state

  useEffect(() => {
    if (nocust) {
      nocust.getSupportedTokens()
        .then(tokenList => {
          const tokens = buildTokenDict(tokenList)
          update(tokens)
        })
        .catch(() => {
          update({})
        })
    }
  }, [eraNumber])

  return tokens
}

export function registerTokens (address) {
  const nocust = useNocustClient()
  const tokens = useTokens()

  useEffect(() => {
    if (tokens) {
      Object.values(tokens).map(async token => {
        if (nocust) {
          const addressRegistered = await nocust.isAddressRegistered(address, token.tokenAddress)
          // explicitly test for false-ness as endpoint returns undefined for true
          if (addressRegistered === false) {
            return registerToken(nocust, address, token.tokenAddress)
          }
        }
        return null
      })
    }
  }, [nocust, address, tokens])
}

async function registerToken (nocust, address, tokenAddress) {
  console.log('Registering token:', tokenAddress)
  try {
    return nocust.registerAddress(address, tokenAddress)
  } catch (e) {
    console.log('Error registering', e)
  }
}

export function isValidToken (tokens, tokenShortName) {
  if (!tokens) return false
  return Object.keys(tokens).includes(tokenShortName)
}

export function lookupTokenAddress (tokens, tokenAddress) {
  if (!tokens) return false
  return Object.values(tokens).find((token) => {
    return tokenAddress === token.tokenAddress
  })
}

export function lookupTokenName (tokenName) {
  const tokens = useTokens()
  if (!tokens) return false
  return Object.values(tokens).find((token) => {
    return tokenName === token.shortName
  })
}
