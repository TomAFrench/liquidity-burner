import React from 'react'
import { Link } from 'react-router-dom'
// import cookie from 'react-cookies'

import Ruler from '../components/Ruler'
import i18n from '../i18n'

import Bottom from '../components/Bottom'

import Transactions from '../components/Transactions'

import Balance from '../components/Balance'

import { useTokens, registerTokens } from '../contexts/Tokens'
import { safeAccess } from '../utils'
import { useAddressBalance } from '../contexts/Balances'
import MainButtons from '../components/MainButtons'

const TOKEN = process.env.REACT_APP_TOKEN

export default (props) => {
  const tokens = useTokens()

  const eth = tokens.ETH
  const token = tokens[TOKEN]
  const ethBalance = useAddressBalance(props.address, safeAccess(eth, ['tokenAddress']))
  const tokenBalance = useAddressBalance(props.address, safeAccess(token, ['tokenAddress']))

  registerTokens(props.address)
  return (
    <div>
      <div className='send-to-address card w-100' style={{ zIndex: 1 }}>
        <div className='form-group w-100'>

          <div style={{ width: '100%', textAlign: 'center' }}>
            <Link to={{ pathname: `${props.url}/send`, search: '?token=' + TOKEN }}>
              <Balance
                token={token}
                balance={tokenBalance}
                offchain
                selected
                address={props.address}
              />
            </Link>
            <Ruler />
            <Balance
              token={token}
              balance={tokenBalance}
              address={props.address}
            />
            <Ruler />
            <Link to={{ pathname: `${props.url}/send`, search: '?token=ETH' }}>
              <Balance
                token={eth}
                balance={ethBalance}
                offchain
                selected
                address={props.address}
              />
            </Link>
            <Ruler />
            <Balance
              token={eth}
              balance={ethBalance}
              address={props.address}
            />
            <Ruler />

            <MainButtons
              url={props.url}
              tokenAddress={token.tokenAddress}
              gwei={props.gwei}
              token={TOKEN}
            />

          </div>
          <Transactions
            changeAlert={props.changeAlert}
            address={props.address}
            token={token}
          />
        </div>
      </div>
      <Link to='/advanced'>
        <Bottom
          icon='wrench'
          text={i18n.t('advance_title')}
          action={() => {}}
        />
      </Link>
    </div>
  )
}
