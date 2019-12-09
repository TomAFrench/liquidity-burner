import React from 'react'
import { Link } from 'react-router-dom'

import { Scaler } from 'dapparatus'
import i18next from 'i18next'

import { useBlocksToWithdrawal } from '../contexts/Withdrawal'

const { toWei } = require('web3-utils')

async function confirmWithdrawal (nocust, address, gwei, tokenAddress) {
  const gasLimit = '300000'

  const txhash = await nocust.withdrawalConfirmation(address, toWei(gwei.toString(), 'gwei'), gasLimit, tokenAddress)
  console.log('withdrawal', txhash)
}

export default (props) => {
  const blocksToWithdrawal = useBlocksToWithdrawal(props.address, props.tokenAddress)

  const withdrawalInProgess = (typeof blocksToWithdrawal !== 'undefined' && blocksToWithdrawal !== -1)

  let withdrawalButton
  if (withdrawalInProgess) {
    withdrawalButton = (
      <div className='content ops row'>
        <div className='col-12 p-1' onClick={() => { if (blocksToWithdrawal === 0) confirmWithdrawal(props.nocust, props.tokenAddress, props.gwei, props.tokenAddress) }}>
          <button className={`btn btn-large w-100 ${blocksToWithdrawal === 0 ? '' : 'disabled'}`} style={props.buttonStyle.primary}>
            <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
              <i className={`fas ${blocksToWithdrawal === 0 ? 'fa-check' : 'fa-clock'}`} /> {blocksToWithdrawal === 0 ? i18next.t('liquidity.withdraw.confirm') : blocksToWithdrawal + ' blocks until confirmation'}
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
          <button className='btn btn-large w-100' style={props.buttonStyle.primary}>
            <Link to={{ pathname: `${props.url}/send`, search: '?token=' + props.token }} style={{ textDecoration: 'none', color: props.buttonStyle.primary.color }}>
              <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                <i className='fas fa-paper-plane' /> {i18next.t('main_card.send')}
              </Scaler>
            </Link>
          </button>
        </div>
      </div>
      <div className='content ops row'>
        <div className='col-6 p-1'>
          <button className='btn btn-large w-100' style={props.buttonStyle.primary}>
            <Link to={`${props.url}/receive`} style={{ textDecoration: 'none', color: props.buttonStyle.primary.color }}>
              <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                <i className='fas fa-qrcode' /> {i18next.t('main_card.receive')}
              </Scaler>
            </Link>
          </button>
        </div>
        <div className='col-6 p-1'>
          <button className='btn btn-large w-100' style={props.buttonStyle.primary}>
            <Link to={`${props.url}/request/${props.token}`} style={{ textDecoration: 'none', color: props.buttonStyle.primary.color }}>
              <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                <i className='fas fa-money-bill-alt' /> {i18next.t('more_buttons.request')}
              </Scaler>
            </Link>
          </button>
        </div>
      </div>
      <div className='content ops row'>
        <div className='col-6 p-1'>
          <button className='btn btn-large w-100' style={props.buttonStyle.secondary}>
            <Link to={`${props.url}/bridge`} style={{ textDecoration: 'none', color: props.buttonStyle.secondary.color }}>
              <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                <i className='fas fa-hand-holding-usd' /> {i18next.t('bridge.title')}
              </Scaler>
            </Link>
          </button>
        </div>
        <div className='col-6 p-1'>
          <button className='btn btn-large w-100' style={props.buttonStyle.secondary}>
            <Link to={`${props.url}/exchange/ETH/${props.token}`} style={{ textDecoration: 'none', color: props.buttonStyle.secondary.color }}>
              <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                <i className='fas fa-random' /> {i18next.t('exchange_title')}
              </Scaler>
            </Link>
          </button>
        </div>
      </div>
    </div>
  )
}
