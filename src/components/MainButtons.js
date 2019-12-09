import React from 'react'
import { Link } from 'react-router-dom'

import { Scaler } from 'dapparatus'

import i18next from 'i18next'
const { toWei } = require('web3-utils')

async function confirmWithdrawal (nocust, address, gwei, token) {
  const gasLimit = '300000'

  const txhash = await nocust.withdrawalConfirmation(address, toWei(gwei.toString(), 'gwei'), gasLimit, token)
  console.log('withdrawal', txhash)
}

export default (props) => {
  return (
    <div>
      {typeof props.withdrawInfo !== 'undefined' && typeof props.withdrawInfo.blocksToWithdrawal !== 'undefined' && props.withdrawInfo.blocksToWithdrawal !== -1 &&
        <div className='content ops row'>
          <div className='col-12 p-1' onClick={() => { if (props.withdrawInfo.blocksToWithdrawal === 0) confirmWithdrawal(props.nocust, props.tokenAddress, props.gwei, props.token) }}>
            <button className={`btn btn-large w-100 ${props.withdrawInfo.blocksToWithdrawal === 0 ? '' : 'disabled'}`} style={props.buttonStyle.primary}>
              <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                <i className={`fas ${props.withdrawInfo.locksToWithdrawal === 0 ? 'fa-check' : 'fa-clock'}`} /> {props.withdrawInfo.blocksToWithdrawal === 0 ? i18next.t('liquidity.withdraw.confirm') : props.withdrawInfo.blocksToWithdrawal + ' blocks until confirmation'}
              </Scaler>
            </button>
          </div>
        </div>}
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
