import React, { useState } from 'react'
import { Scaler } from 'dapparatus'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import i18n from '../i18n'
import { useButtonStyle } from '../contexts/Theme'
const QRCode = require('qrcode.react')

export default (props) => {
  const buttonStyle = useButtonStyle()

  const [customQr, setCustomQr] = useState()
  const [showCustomQr, setShowCustomQr] = useState(false)

  const [privateKeyQr, setPrivateKeyQr] = useState(false)
  const [newPrivateKey, setNewPrivatekey] = useState()
  const [newSeedPhrase, setNewSeedPhrase] = useState()

  const [seedPhraseHidden, setSeedPhraseHidden] = useState(false)
  const [privateKeyHidden, setPrivateKeyHidden] = useState(false)

  const { balance, privateKey, changeAlert, setPossibleNewPrivateKey } = props

  const qrSize = Math.min(document.documentElement.clientWidth, 512) - 90

  let privateKeyQrDisplay = ''
  if (privateKeyQr) {
    privateKeyQrDisplay = (
      <div className='main-card card w-100'>
        <div className='content qr row'>
          <QRCode value={privateKey} size={qrSize} />
        </div>
      </div>
    )
  }

  let showingQr = ''
  if (showCustomQr) {
    showingQr = (
      <div className='main-card card w-100'>
        <div className='content qr row'>
          <QRCode value={customQr} size={qrSize} />
        </div>
      </div>
    )
  }

  let inputPrivateEyeButton = ''
  let inputPrivateSize = 'col-4 p-1'

  if (newPrivateKey) {
    inputPrivateEyeButton = (
      <div className='col-2 p-1'>
        <button className='btn btn-large w-100' style={buttonStyle.secondary} onClick={() => { setPrivateKeyHidden(!privateKeyHidden) }}>
          <i className='fas fa-eye' />
        </button>
      </div>
    )
  } else {
    inputPrivateSize = 'col-6 p-1'
  }

  const inputPrivateKeyRow = (
    <div className='content ops row'>
      <div className={inputPrivateSize}>
        <input
          type={privateKeyHidden ? 'password' : 'text'} autoCorrect='off' autoCapitalize='none' className='form-control' placeholder='private key' value={newPrivateKey} onChange={event => setNewPrivatekey(event.target.value)}
        />
      </div>
      {inputPrivateEyeButton}
      <div className='col-6 p-1'>
        <button
          className='btn btn-large w-100' style={buttonStyle.primary}
          onClick={() => {
            if (newPrivateKey && newPrivateKey.length >= 64 && newPrivateKey.length <= 66) {
              props.history.push('/')
              let possibleNewPrivateKey = newPrivateKey
              if (possibleNewPrivateKey.indexOf('0x') !== 0) {
                possibleNewPrivateKey = '0x' + possibleNewPrivateKey
              }
              setPossibleNewPrivateKey(possibleNewPrivateKey)
            } else {
              changeAlert({ type: 'warning', message: 'Invalid private key.' })
            }
          }}
        >
          <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
            <i className='fas fa-plus-square' /> {i18n.t('create')}
          </Scaler>
        </button>
      </div>
    </div>
  )

  let inputSeedEyeButton = ''
  let inputSeedSize = 'col-4 p-1'

  if (newSeedPhrase) {
    inputSeedEyeButton = (
      <div className='col-2 p-1'>
        <button className='btn btn-large w-100' style={buttonStyle.secondary} onClick={() => { setSeedPhraseHidden(!seedPhraseHidden) }}>
          <i className='fas fa-eye' />
        </button>
      </div>
    )
  } else {
    inputSeedSize = 'col-6 p-1'
  }

  const inputSeedRow = (
    <div className='content ops row' style={{ paddingTop: 10 }}>
      <div className={inputSeedSize}>
        <input
          type={seedPhraseHidden ? 'password' : 'text'} autoCorrect='off' autoCapitalize='none' className='form-control' placeholder='seed phrase' value={newSeedPhrase}
          onChange={event => setNewSeedPhrase(event.target.value)}
        />
      </div>
      {inputSeedEyeButton}
      <div className='col-6 p-1'>
        <button
          className='btn btn-large w-100' style={buttonStyle.primary}
          onClick={() => {
            if (!newSeedPhrase) {
              changeAlert({ type: 'warning', message: 'Invalid seed phrase.' })
            } else {
                import('ethereum-mnemonic-privatekey-utils').then(pkutils => {
                  const newPrivateKey = pkutils.getPrivateKeyFromMnemonic(newSeedPhrase)
                  props.history.push('/')
                  setPossibleNewPrivateKey('0x' + newPrivateKey)
                })
            }
          }}
        >
          <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
            <i className='fas fa-plus-square' /> {i18n.t('create')}
          </Scaler>
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ marginTop: 20 }}>

      <div>
        <div style={{ width: '100%', textAlign: 'center' }}><h5>Learn More</h5></div>
        <div className='content ops row' style={{ marginBottom: 10 }}>
          <div className='col-6 p-1'>
            <a href='https://github.com/TomAFrench/liquidity-burner' style={{ color: '#FFFFFF' }} target='_blank' rel='noopener noreferrer'>
              <button className='btn btn-large w-100' style={buttonStyle.secondary}>
                <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                  <i className='fas fa-code' /> {i18n.t('code')}
                </Scaler>
              </button>
            </a>
          </div>
          <div className='col-6 p-1'>
            <a href='https://blog.liquidity.network/2018/11/21/nocust-101/' style={{ color: '#FFFFFF' }} target='_blank' rel='noopener noreferrer'>
              <button className='btn btn-large w-100' style={buttonStyle.secondary}>
                <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                  <i className='fas fa-info' /> {i18n.t('about')}
                </Scaler>
              </button>
            </a>
          </div>
        </div>
      </div>

      <hr style={{ paddingTop: 20 }} />

      {privateKey &&
        <div>
          <div style={{ width: '100%', textAlign: 'center' }}><h5>Private Key</h5></div>
          <div className='content ops row' style={{ marginBottom: 10 }}>

            <div className='col-6 p-1'>
              <button
                className='btn btn-large w-100'
                style={buttonStyle.secondary}
                onClick={() => setPrivateKeyQr(!privateKeyQr)}
              >
                <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                  <i className='fas fa-key' /> {i18n.t('show')}
                </Scaler>
              </button>
            </div>

            <CopyToClipboard text={privateKey}>
              <div
                className='col-6 p-1'
                onClick={() => changeAlert({ type: 'success', message: 'Private Key copied to clipboard' })}
              >
                <button className='btn btn-large w-100' style={buttonStyle.secondary}>
                  <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                    <i className='fas fa-key' /> {i18n.t('copy')}
                  </Scaler>
                </button>
              </div>
            </CopyToClipboard>

          </div>
          <div className='content ops row'>
            {privateKeyQrDisplay}
          </div>

        </div>}

      {privateKey &&
        <div>
          <div className='content ops row'>
            <div className='col-12 p-1'>
              <button
                className='btn btn-large w-100' style={buttonStyle.primary}
                onClick={() => {
                  console.log('BALANCE', balance)
                  props.history.push('/burn')
                }}
              >
                <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                  <i className='fas fa-fire' /> {i18n.t('burn')}
                </Scaler>
              </button>
            </div>
          </div>
          <hr style={{ paddingTop: 20 }} />
        </div>}

      <div style={{ width: '100%', textAlign: 'center' }}><h5>Create Account</h5></div>

      {inputPrivateKeyRow}

      {inputSeedRow}

      <hr style={{ paddingTop: 20 }} />
      <div style={{ width: '100%', textAlign: 'center' }}><h5>Extra Tools</h5></div>

      <div className='content ops row'>
        <div className='col-6 p-1'>
          <input
            type='text' autoCorrect='off' autoCapitalize='none' className='form-control' placeholder='any text to encode' value={customQr}
            onChange={event => setCustomQr(event.target.value)}
          />
        </div>
        <div className='col-6 p-1'>
          <button
            className='btn btn-large w-100' style={buttonStyle.secondary}
            onClick={() => setShowCustomQr(customQr)}
          >
            <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
              <i className='fas fa-qrcode' /> {i18n.t('advanced.to_qr')}
            </Scaler>
          </button>
        </div>
      </div>
      {showingQr}

    </div>
  )
}