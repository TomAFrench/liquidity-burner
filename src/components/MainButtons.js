import React from 'react'
import { Link } from 'react-router-dom'

import { Scaler } from 'dapparatus'
import i18next from 'i18next'

import { getNextAvailableConfirmation } from '../contexts/Withdrawal'
import { useNocustClient } from '../contexts/Nocust'
import { useButtonStyle } from '../contexts/Theme'

const { toWei } = require('web3-utils')
const humanizeDuration = require('humanize-duration')

async function confirmWithdrawal (nocust, address, gwei, tokenAddress) {
  const gasLimit = '300000'

  const txhash = await nocust.withdrawalConfirmation(address, toWei(gwei.toString(10), 'gwei'), gasLimit, tokenAddress)
  console.log('withdrawal', txhash)
}

const BLOCK_TIME = 15 * 1000

export default (props) => {
  const nocust = useNocustClient()
  const buttonStyle = useButtonStyle()
  const { tokenAddress, blocksToWithdrawal } = getNextAvailableConfirmation(props.address)
  // console.log('NEXT CONFIRMATION', tokenAddress, blocksToWithdrawal)
  const timeToWithdrawal = humanizeDuration(BLOCK_TIME * blocksToWithdrawal, { largest: 2, units: ['h', 'm', 's'] })

  const withdrawalInProgess = (typeof blocksToWithdrawal !== 'undefined' && blocksToWithdrawal !== -1)

  let withdrawalButton
  if (withdrawalInProgess) {
    withdrawalButton = (
      <div className='content ops row'>
        <div className='col-12 p-1' onClick={() => { if (blocksToWithdrawal === 0) confirmWithdrawal(nocust, props.address, props.gwei, tokenAddress) }}>
          <button className={`btn btn-large w-100 ${blocksToWithdrawal === 0 ? '' : 'disabled'}`} style={buttonStyle.primary}>
            <Scaler config={{ startZoomAt: 500, origin: '0% 50%' }}>
              <i className={`fas ${blocksToWithdrawal === 0 ? 'fa-check' : 'fa-clock'}`} /> {blocksToWithdrawal === 0 ? i18next.t('confirm_withdraw') : blocksToWithdrawal + ' blocks (' + timeToWithdrawal + ') until confirmation'}
            </Scaler>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {withdrawalButton}
      <div className='content ops row'>
        <div className='col-12 p-1'>
          <button className='btn btn-large w-100' style={buttonStyle.primary}>
            <Link to={{ pathname: `${props.url}/send`, search: '?token=' + props.token }} style={{ textDecoration: 'none', color: buttonStyle.primary.color }}>
              <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                <i className='fas fa-paper-plane' /> {i18next.t('main_card.send')}
              </Scaler>
            </Link>
          </button>
        </div>
      </div>
      <div className='content ops row'>
        <div className='col-6 p-1'>
          <button className='btn btn-large w-100' style={buttonStyle.primary}>
            <Link to={`${props.url}/receive`} style={{ textDecoration: 'none', color: buttonStyle.primary.color }}>
              <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                <i className='fas fa-qrcode' /> {i18next.t('main_card.receive')}
              </Scaler>
            </Link>
          </button>
        </div>
        <div className='col-6 p-1'>
          <button className='btn btn-large w-100' style={buttonStyle.primary}>
            <Link to={`${props.url}/request/${props.token}`} style={{ textDecoration: 'none', color: buttonStyle.primary.color }}>
              <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                <i className='fas fa-money-bill-alt' /> {i18next.t('more_buttons.request')}
              </Scaler>
            </Link>
          </button>
        </div>
      </div>
      <div className='content ops row'>
        <div className='col-6 p-1'>
          <button className='btn btn-large w-100' style={buttonStyle.secondary}>
            <Link to={`${props.url}/bridge`} style={{ textDecoration: 'none', color: buttonStyle.secondary.color }}>
              <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                <i className='fas fa-hand-holding-usd' /> {i18next.t('bridge.title')}
              </Scaler>
            </Link>
          </button>
        </div>
        <div className='col-6 p-1'>
          <button className='btn btn-large w-100 disabled' style={buttonStyle.secondary} onClick={() => props.changeAlert({ type: 'success', message: 'Coming Soon!' })}>
            {/* <Link to={`${props.url}/exchange/${props.token}/ETH`} style={{ textDecoration: 'none', color: buttonStyle.secondary.color }}> */}
            <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
              <i className='fas fa-random' /> {i18next.t('exchange_title')}
            </Scaler>
            {/* </Link> */}
          </button>
        </div>
      </div>
    </div>
  )
}
