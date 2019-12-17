import React from 'react'
import { useHistory } from 'react-router-dom'

import i18n from '../i18n'

import Ruler from './Ruler'
import Balance from './Balance'
import SwapBar from './SwapBar'

import { useWithdrawalLimit } from '../contexts/Withdrawal'
import { useTokens } from '../contexts/Tokens'
import { useAddressBalance, useOnchainAddressBalance } from '../contexts/Balances'
import { useNocustClient } from '../contexts/Nocust'
import { useButtonStyle } from '../contexts/Theme'

import { safeAccess } from '../utils'

export default (props) => {
  const buttonStyle = useButtonStyle()
  const nocust = useNocustClient()
  const history = useHistory()
  const tokens = useTokens()
  const eth = safeAccess(tokens, ['ETH']) || {}
  const token = safeAccess(tokens, [props.token]) || {}
  const balance = useAddressBalance(props.address, token.tokenAddress)
  const ethBalance = useOnchainAddressBalance(props.address, eth.tokenAddress)

  const withdrawLimit = useWithdrawalLimit(props.address, token.tokenAddress)

  const gasLimit = '400000'

  if (!balance || !balance.onchainBalance || !balance.offchainBalance) {
    return null
  }

  return (
    <div>
      <Balance
        address={props.address}
        token={token}
        offchain
        selected
      />
      <Ruler />
      <SwapBar
        buttonStyle={buttonStyle}
        changeAlert={props.changeAlert}
        text={token ? token.shortName : i18n.t('loading')}
        ethBalance={ethBalance}
        onchainBalance={balance.onchainBalance}
        offchainBalance={balance.offchainBalance}
        withdrawLimit={withdrawLimit}
        deposit={async (amount) => {
          try {
            const txHash = await nocust.approveAndDeposit(props.address, amount, props.gasPrice, gasLimit, token.tokenAddress)
            history.push('/liquidity/sending', { title: 'Sending ' + token.shortName + ' into the Liquidity Network...', subtitle: 'Tokens can take between 5-10 minutes to appear on the hub' })
            props.onSend(txHash)
          } catch (e) {
            console.log(e)
            props.changeAlert({ type: 'warning', message: 'Transaction Failed' })
          }
        }}
        requestWithdraw={async (amount) => {
          try {
            const txHash = await nocust.withdrawalRequest(props.address, amount, props.gasPrice, gasLimit, token.tokenAddress)
            history.push('/liquidity/sending', { title: 'Requesting to withdraw ' + token.shortName + ' from the Liquidity Network...', subtitle: 'Withdrawals can take up to 72 hours to become available to confirm onchain' })
            props.onSend(txHash)
          } catch (e) {
            console.log(e)
            props.changeAlert({ type: 'warning', message: 'Transaction Failed' })
          }
        }}
      />
      <Balance
        address={props.address}
        token={token}
        selected
      />
      <Ruler />
    </div>
  )
}
