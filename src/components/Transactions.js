import React from 'react'
import { Blockie, Scaler } from 'dapparatus'

import { CopyToClipboard } from 'react-copy-to-clipboard'
import i18n from '../i18n'

const { fromWei } = require('web3-utils')

const cleanTime = (s) => {
  if (s < 60) {
    return s + 's'
  } else if (s / 60 < 60) {
    return Math.round(s / 6) / 10 + 'm'
  } else {
    return Math.round((s / 60 / 6) / 24) / 10 + 'd'
  }
}

const TransactionEntry = ({ tx, changeAlert, token }) => {
  const blockAge = (Date.now() - tx.timestamp) / 1000

  const dollarView = (
    <span>
      <span style={{ opacity: 0.33 }}>-</span>{fromWei(tx.amount.toString(), 'ether')} f{token.shortName}<span style={{ opacity: 0.33 }}>-></span>
    </span>
  )

  const fromBlockie = (
    <CopyToClipboard
      text={tx.wallet.address} onCopy={() => {
        changeAlert({ type: 'success', message: i18n.t('receive.address_copied') + ': ' + tx.wallet.address })
      }}
    >
      <div style={{ cursor: 'pointer' }}>
        <Blockie
          address={tx.wallet.address}
          config={{ size: 4 }}
        />
      </div>
    </CopyToClipboard>
  )

  const toBlockie = (
    <CopyToClipboard
      text={tx.recipient.address} onCopy={() => {
        changeAlert({ type: 'success', message: i18n.t('receive.address_copied') + ': ' + tx.recipient.address })
      }}
    >
      <div style={{ cursor: 'pointer' }}>
        <Blockie
          address={tx.recipient.address}
          config={{ size: 4 }}
        />
      </div>
    </CopyToClipboard>
  )

  return (
    <div style={{ position: 'relative' }} className='content bridge row'>
      <div className='col-3 p-1' style={{ textAlign: 'center' }}>
        {fromBlockie}
      </div>
      <div className='col-3 p-1' style={{ textAlign: 'center', whiteSpace: 'nowrap', letterSpacing: -1 }}>
        <Scaler config={{ startZoomAt: 600, origin: '25% 50%', adjustedZoom: 1 }}>
          {dollarView}
        </Scaler>
      </div>
      <div className='col-3 p-1' style={{ textAlign: 'center', whiteSpace: 'nowrap', letterSpacing: -1 }}>
        {toBlockie}
      </div>
      <div className='col-2 p-1' style={{ textAlign: 'center', whiteSpace: 'nowrap', letterSpacing: -1 }}>
        <Scaler config={{ startZoomAt: 600, origin: '25% 50%', adjustedZoom: 1 }}>
          <span style={{ marginLeft: 5, marginTop: -5, opacity: 0.4, fontSize: 12 }}>{cleanTime((blockAge))} ago</span>
        </Scaler>
      </div>

    </div>
  )
}

export default ({ max, recentTxs, changeAlert, token }) => {
  const txns = []
  let count = 0
  if (!max) max = 9999
  for (const r in recentTxs) {
    if (count++ < max) {
      txns.push(<hr key={'ruler' + recentTxs[r].tx_id} style={{ color: '#DFDFDF', marginTop: 0, marginBottom: 7 }} />)
      txns.push(<TransactionEntry key={recentTxs[r].tx_id} tx={recentTxs[r]} changeAlert={changeAlert} token={token} />)
    }
  }
  if (txns.length > 0) {
    return (
      <div style={{ marginTop: 30 }}>
        {txns}
      </div>
    )
  } else {
    return (
      <span />
    )
  }
}
