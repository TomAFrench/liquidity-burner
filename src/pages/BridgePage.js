import React from 'react'

import { Scaler } from 'dapparatus'
import i18n from '../i18n'

import Ruler from '../components/Ruler'
import NavCard from '../components/NavCard'
import Bridge from '../components/Bridge'

import { useWithdrawalFee } from '../contexts/Withdrawal'

const { toWei, fromWei } = require('web3-utils')

const TOKEN = process.env.REACT_APP_TOKEN

export default ({ address, gwei, buttonStyle, changeAlert, backButton }) => {
  const withdrawFee = useWithdrawalFee(gwei)

  return (
    <div>
      <div className='main-card card w-100' style={{ zIndex: 1 }}>
        <NavCard title={i18n.t('bridge.title')} />
        <div style={{ textAlign: 'center', width: '100%', fontSize: 16, marginTop: 10 }}>
          <Scaler config={{ startZoomAt: 400, origin: '50% 50%', adjustedZoom: 1 }}>
      Withdrawal Fee: {typeof withdrawFee !== 'undefined' ? fromWei(withdrawFee.toString(), 'ether').toString() : 0} ETH
          </Scaler>
        </div>
        <Ruler />
        <Bridge
          address={address}
          token='ETH'
          buttonStyle={buttonStyle}
          gasPrice={toWei(gwei.toString(), 'gwei')}
          changeAlert={changeAlert}
          onSend={() => {}}
        />
        <Ruler />
        <Bridge
          address={address}
          token={TOKEN}
          buttonStyle={buttonStyle}
          gasPrice={toWei(gwei.toString(), 'gwei')}
          changeAlert={changeAlert}
          onSend={() => {}}
        />
      </div>
      {backButton}
    </div>
  )
}
