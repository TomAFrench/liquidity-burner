import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import QrReader from 'react-qr-reader'
import FileReaderInput from 'react-file-reader-input'
import qrimage from '../qrcode.png'
import i18n from '../i18n'
import { ThemeContext } from '../contexts/Theme'
import { isAddress } from 'web3-utils'
import { safeAccess } from '../utils'
const qs = require('query-string')

function base64ToBitmap (base64) {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      context.drawImage(img, 0, 0)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      resolve({
        data: Buffer.from(imageData.data),
        width: canvas.width,
        height: canvas.height
      })
    }
    img.src = base64
  })
}

const decodeData = data => {
  // detect and respect LQD Net deep links...
  if (!data) {
    console.log('No data')
    return ({ success: false })
  } else if (data.indexOf('lqdnet://send') >= 0) {
    const address = qs.parse(data).publicKey
    const token = qs.parse(data).tokenAddress
    const amount = qs.parse(data).amount

    console.log('LQD Net Deep Link payment', address, token, amount)

    return ({ success: true, data: { toAddress: address, search: { token, amount } } })
  } else if (isAddress(data) || data.indexOf('.eth') >= 0) {
    console.log('Found Address/ENS:', data)
    return ({ success: true, data: { toAddress: data } })
  } else {
    console.log("Can't decode data:", data)
    return ({ success: false, data: data })
  }
}

class LegacyReader extends Component {
  static contextType = ThemeContext

  legacyHandleChange (e, results) {
    results.forEach(result => {
      const [, file] = result
      const reader = new window.FileReader()
      reader.onload = (e) => {
        Promise.all([
          base64ToBitmap(e.target.result),
          import('qrcode-reader')
        ])
          .then(([bitmap, { default: QrCode }]) => {
            console.log(QrCode)
            const qr = new QrCode()
            qr.callback = (err, value) => {
              if (err) {
                console.log('FAILED TO SCAN!!!')
                this.props.onFail(err.toString())
              } else if (value && value.result) {
                const { success, data } = decodeData(value.result)
                if (success) {
                  this.props.onSuccess(data)
                } else {
                  this.props.onFail(data)
                }
              }
            }
            qr.decode(bitmap)
          })
          .catch(err => {
            window.alert('ERR1')
            console.error('ERR1', err)
            this.props.onFail(err.toString())
          })
      }
      reader.readAsDataURL(file)
    })
  }

  render () {
    const backgroundColor = safeAccess(this.context[0], ['mainStyle', 'mainColor'])
    return (
      <FileReaderInput as='binary' id='my-file-input' onChange={this.legacyHandleChange.bind(this)}>
        <div style={{ position: 'absolute', zIndex: 11, top: 0, left: 0, width: '100%', height: '100%', color: '#FFFFFF', cursor: 'pointer' }}>
          <div style={{ textAlign: 'center', paddingTop: '15%' }}>
            <div style={{ marginBottom: 20 }}><i className='fas fa-camera' /></div>
            <img src={qrimage} style={{ position: 'absolute', left: '36%', top: '25%', padding: 4, border: '1px solid #888888', opacity: 0.25, maxWidth: '30%', maxHight: '30%' }} />
          </div>
          <div style={{ textAlign: 'center', paddingTop: '35%' }}>

            <div>{i18n.t('send_by_scan.capture')}</div>
            <div className='main-card card w-100' style={{ backgroundColor: '#000000' }}>
              <div className='content ops row' style={{ paddingLeft: '12%', paddingRight: '12%', paddingTop: 10 }}>
                <button className='btn btn-large w-100' style={{ backgroundColor }}>
                  <i className='fas fa-camera' /> {i18n.t('send_by_scan.take_photo')}
                </button>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', paddingTop: '5%' }}>
            Lay QR flat and take a picture of it from a distance.
          </div>
        </div>
      </FileReaderInput>
    )
  }
}

const Reader = (props) => {
  return (
    <QrReader
      delay={400} // delay = false stops scanning
      onError={props.onError}
      onScan={(scanData) => {
        const { success, data } = decodeData(scanData)
        if (success) {
          props.onSuccess(data)
        } else {
          props.onFail(data)
        }
      }}
      style={{ width: '100%' }}
      resolution={1200}
    />
  )
}

class SendByScan extends Component {
  static contextType = ThemeContext

  constructor (props) {
    super(props)
    let defaultToLegacyMode = false
    if (!navigator || !navigator.mediaDevices) {
      defaultToLegacyMode = true
    }
    this.state = {
      legacyMode: defaultToLegacyMode,
      scanFail: false
    }
  }

  handleError = error => {
    console.log('SCAN ERROR')
    console.error(error)
    this.setState({ legacyMode: true })
    this.props.onError(error)
  }

  handleFailure = (scanFail) => {
    this.setState({ scanFail })
    setTimeout(() => { this.setState({ scanFail: false }) }, 3500)
  }

  render () {
    const { legacyMode, scanFail, scanData } = this.state

    if (scanData) {
      return <Redirect to={{ pathname: '/liquidity/send/' + scanData.toAddress, search: qs.stringify({ ...qs.parse(this.props.search), ...scanData.search }) }} />
    }

    let failMessage = ''
    if (scanFail) {
      failMessage = (
        <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 99, fontSize: 24, color: '#FF0000', backgroundColor: '#333333', opacity: 0.9, width: '100%', height: '100%', fontWeight: 'bold' }}>
          <div style={{ textAlign: 'center', paddingTop: '15%' }}>
            <div style={{ marginBottom: 20 }}><i className='fas fa-ban' /></div>
          </div>
          <div style={{ textAlign: 'center', paddingTop: '25%' }}>
            <div>{i18n.t('send_by_scan.try_again')}</div>

          </div>
          <div style={{ textAlign: 'center', padding: '10%', paddingTop: '15%', fontSize: 16 }}>
            <div>{scanFail}</div>
          </div>
        </div>
      )
    }

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5, margin: '0 auto !important', background: '#000000' }}>
        <div style={{ position: 'absolute', zIndex: 256, top: 20, right: 20, fontSize: 80, paddingRight: 20, color: '#FFFFFF', cursor: 'pointer' }} onClick={() => this.props.goBack()}>
          <i className='fa fa-times' aria-hidden='true' />
        </div>
        {legacyMode ? <LegacyReader onSuccess={(scanData) => { this.setState({ scanData }) }} onFail={(scanFail) => { this.handleFailure(scanFail) }} />
          : <Reader onError={this.handleError} onSuccess={(scanData) => { this.setState({ scanData }) }} onFail={(scanFail) => { this.handleFailure(scanFail) }} />}
        <div style={{ position: 'absolute', zIndex: 11, bottom: 20, fontSize: 12, left: 20, color: '#FFFFFF', opacity: 0.333 }}>
          {navigator.userAgent} - {JSON.stringify(navigator.mediaDevices)}
        </div>
        {failMessage}
      </div>
    )
  }
}

export default SendByScan
