import React from 'react'
import { useHistory } from 'react-router-dom'

import i18n from '../i18n'

import Ruler from './Ruler'
import Balance from './Balance'
import SwapBar from './SwapBar'

import { useWithdrawalLimit } from '../contexts/Withdrawal'

export default (props) => {
  const history = useHistory()
  const withdrawLimit = useWithdrawalLimit(props.address, props.token.tokenAddress)

  const gasLimit = '300000'

  if (!props.balance || !props.balance.onchainBalance || !props.balance.offchainBalance) {
    return null
  }
  return (
    <div>
      <Balance
        token={props.token}
        balance={props.balance}
        offchain
        selected
      />
      <Ruler />
      <SwapBar
        buttonStyle={props.buttonStyle}
        changeAlert={props.changeAlert}
        text={props.token ? props.token.shortName : i18n.t('loading')}
        ethBalance={props.ethBalance}
        onchainBalance={props.balance.onchainBalance}
        offchainBalance={props.balance.offchainBalance}
        withdrawLimit={withdrawLimit}
        deposit={async (amount) => {
          try {
            await props.nocust.approveAndDeposit(props.address, amount, props.gasPrice, gasLimit, props.token.tokenAddress)
            history.push('/liquidity/sending', { title: 'Sending ' + props.token.shortName + ' into the Liquidity Network...', subtitle: 'Tokens can take between 5-10 minutes to appear on the hub' })
            props.onSend()
          } catch (e) {
            console.log(e)
            props.changeAlert({ type: 'warning', message: 'Transaction Failed' })
          }
        }}
        requestWithdraw={async (amount) => {
          try {
            await props.nocust.withdrawalRequest(props.address, amount, props.gasPrice, gasLimit, props.token.tokenAddress)
            history.push('/liquidity/sending', { title: 'Requesting to withdraw ' + props.token.shortName + ' from the Liquidity Network...', subtitle: 'Withdrawals can take up to 72 hours to become available to confirm onchain' })
            props.onSend()
          } catch (e) {
            console.log(e)
            props.changeAlert({ type: 'warning', message: 'Transaction Failed' })
          }
        }}
      />
      <Balance
        token={props.token}
        balance={props.balance}
        selected
      />
      <Ruler />
    </div>
  )
}
