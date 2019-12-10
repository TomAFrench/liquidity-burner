import React from 'react'

import i18n from '../i18n'

import Ruler from '../components/Ruler'
import NavCard from '../components/NavCard'
import Request from '../components/Request'
import Balance from '../components/Balance'

import { useTokens } from '../contexts/Tokens'

export default ({ address, history, match, mainStyle, buttonStyle, changeAlert, backButton }) => {
  const tokens = useTokens()
  const token = tokens[match.params.token]
  const netId = 4

  return (
    <div>
      <div className='main-card card w-100' style={{ zIndex: 1 }}>
        <NavCard title={i18n.t('request_funds')} />
        <Balance
          token={token}
          offchain
          selected
          address={address}
        />
        <Ruler />
        <Request
          mainStyle={mainStyle}
          buttonStyle={buttonStyle}
          token={token}
          address={address}
          networkId={netId}
          changeAlert={changeAlert}
        />
      </div>
      {backButton}
    </div>
  )
}
