import React from 'react'

import Ruler from '../components/Ruler'
import i18n from '../i18n'

import NavCard from '../components/NavCard'
import SendToAddress from '../components/SendToAddress'
import Balance from '../components/Balance'
import Transactions from '../components/Transactions'

import { useOffchainAddressBalance } from '../contexts/Balances'
import { lookupTokenAddress } from '../contexts/Tokens'

import { safeAccess } from '../utils'
import { isAddress, fromWei } from 'web3-utils'
import { useNocustClient } from '../contexts/Nocust'
import { useButtonStyle } from '../contexts/Theme'
const qs = require('query-string')

export default (props) => {
  const buttonStyle = useButtonStyle()
  const nocust = useNocustClient()

  const query = qs.parse(props.location.search)

  // First look up token address.
  // May have been given the token's shortname so perform lookup if that fails
  // Finally default to main token.
  let token = props.tokens.ETH
  if (isAddress(query.token)) {
    token = lookupTokenAddress(props.tokens, query.token)
  } else {
    token = safeAccess(props.tokens, [query.token]) || props.tokens[process.env.REACT_APP_TOKEN]
  }

  const tokenBalance = useOffchainAddressBalance(props.address, token.tokenAddress)
  const toAddress = typeof props.location.state !== 'undefined' ? props.location.state.toAddress : undefined
  const tokenAmount = typeof query.amount === 'string' ? fromWei(query.amount, 'ether') : undefined

  return (
    <div>
      <div className='send-to-address card w-100' style={{ zIndex: 1 }}>

        <NavCard title={i18n.t('send_to_address_title')} />
        <Balance
          token={token}
          offchain
          selected
          address={props.address}
        />
        <Ruler />
        <SendToAddress
          token={token}
          sendTransaction={(tx) => nocust.sendTransaction(tx)}
          toAddress={toAddress}
          amount={tokenAmount}
          ensLookup={props.ensLookup}
          buttonStyle={buttonStyle}
          offchainBalance={tokenBalance}
          address={props.address}
          changeAlert={props.changeAlert}
          onSend={async (txhash) => {
            props.history.push(`${props.url}/sending`)
            const tx = await nocust.getTransaction(await txhash)
            console.log(tx)
          }}
        />
        <Transactions
          changeAlert={props.changeAlert}
          address={props.address}
          token={token}
          max={5}
        />
      </div>
      {props.backButton}
    </div>
  )
}
