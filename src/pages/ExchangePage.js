import React from 'react'
import { Redirect } from 'react-router-dom'
import i18n from '../i18n'

import NavCard from '../components/NavCard'
import Exchange from '../components/Exchange'
import { isValidToken, useTokens } from '../contexts/Tokens'

export default ({ history, match, address, buttonStyle, backButton }) => {
  // check if tokens are valid
  const assetA = match.params.assetA
  const assetB = match.params.assetB
  const tokens = useTokens()

  // redirect to main page if invalid
  if (!isValidToken(tokens, assetA) || !isValidToken(tokens, assetB)) {
    return (
      <Redirect to={match.url} />
    )
  }

  console.log('valid exchange pair', assetA, '-', assetB)
  return (
    <div>
      <div className='main-card card w-100' style={{ zIndex: 1 }}>
        <NavCard title={i18n.t('exchange_title')} />
        <Exchange
          assetA={assetA}
          assetB={assetB}
          address={address}
        />
      </div>
      {backButton}
    </div>
  )
}
