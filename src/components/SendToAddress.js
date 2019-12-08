import React from 'react'
import cookie from 'react-cookies'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import Blockies from 'react-blockies'
import { scroller } from 'react-scroll'
import i18n from '../i18n'
import AddressBar from './AddressBar'
import AmountBar from './AmountBar'

const { toWei, fromWei, toBN } = require('web3-utils')

export default class SendToAddress extends React.Component {
  constructor (props) {
    super(props)

    let startAmount = props.amount
    if (!startAmount) {
      startAmount = cookie.load('sendToStartAmount')
    } else {
      cookie.save('sendToStartAmount', startAmount, { path: '/', maxAge: 60 })
    }

    let toAddress = props.toAddress
    if (!toAddress) {
      toAddress = cookie.load('sendToAddress')
    } else {
      cookie.save('sendToAddress', toAddress, { path: '/', maxAge: 60 })
    }

    const initialState = {
      amount: startAmount,
      toAddress: toAddress,
      fromEns: '',
      canSend: false
    }

    this.state = initialState

    if (this.state.toAddress && this.state.toAddress.indexOf('.eth') >= 0) {
      this.ensLookup(toAddress)
    }
  }

  updateState = async (key, value) => {
    if (key === 'amount') {
      cookie.save('sendToStartAmount', value, { path: '/', maxAge: 60 })
    } else if (key === 'toAddress') {
      cookie.save('sendToAddress', value, { path: '/', maxAge: 60 })
    }
    this.setState({ [key]: value }, () => {
      this.setState({ canSend: this.canSend() }, () => {
        if (key !== 'message') {
          this.bounceToAmountIfReady()
        }
      })
    })
    if (key === 'toAddress') {
      this.setState({ fromEns: '' })
      if (value.indexOf('.eth') >= 0) {
        this.ensLookup(value)
      }
    }
  };

  async ensLookup (name) {
    console.log('Attempting to look up ', name)
    const addr = await this.props.ensLookup(name)

    console.log('Resolved:', addr)
    if (addr !== '0x0000000000000000000000000000000000000000') {
      this.setState({ toAddress: addr, fromEns: name }, () => {
        this.bounceToAmountIfReady()
      })
    }
  }

  bounceToAmountIfReady () {
    if (this.state.toAddress && this.state.toAddress.length === 42) {
      this.amountInput.focus()
    }
  }

  componentDidMount () {
    this.setState({ canSend: this.canSend() })
    setTimeout(() => {
      if (!this.state.toAddress && this.addressInput) {
        this.addressInput.focus()
      } else if (!this.state.amount && this.amountInput) {
        this.amountInput.focus()
      } else if (this.messageInput) {
        this.messageInput.focus()
        setTimeout(() => {
          this.scrollToBottom()
        }, 30)
      }
    }, 350)
  }

  canSend () {
    return (this.state.toAddress && this.state.toAddress.length === 42 && this.state.amount >= 0)
  }

  scrollToBottom () {
    console.log('scrolling to bottom')
    scroller.scrollTo('theVeryBottom', {
      duration: 500,
      delay: 30,
      smooth: 'easeInOutCubic'
    })
  }

  handleSend = async () => {
    let { toAddress, amount } = this.state
    const { convertToDollar } = this.props

    amount = convertToDollar(amount)
    console.log('CONVERTED TO DOLLAR AMOUNT', amount)

    if (this.state.canSend) {
      if (!this.state.amount) {
        return false
      }
      const amountWei = toBN(toWei(this.state.amount, 'ether'))

      console.log('this.props.balance', this.props.offchainBalance, 'amountWei', amountWei.toString())

      if (typeof this.props.offchainBalance === 'undefined') {
        this.props.changeAlert({ type: 'warning', message: "Can't read balance" })
      } else if (toBN(this.props.offchainBalance).lt(amountWei)) {
        console.log('Not enough funds', this.props.offchainBalance.toString())
        this.props.changeAlert({ type: 'warning', message: 'Not enough funds' })
      } else {
        let value = 0
        console.log('amount', amount)
        if (amount) {
          value = amount
        }

        cookie.remove('sendToStartAmount', { path: '/' })
        cookie.remove('sendToStartMessage', { path: '/' })
        cookie.remove('sendToAddress', { path: '/' })

        const transaction = {
          to: toAddress,
          from: this.props.address,
          amount: toWei(value, 'ether').toString(),
          tokenAddress: this.props.token.tokenAddress
        }

        console.log(transaction)

        this.props.sendTransaction(transaction)
        // console.log("transaction response", response)
        if (typeof this.props.onSend === 'function') {
          this.props.onSend()
        }
      }
    } else {
      this.props.changeAlert({ type: 'warning', message: i18n.t('send_to_address.error') })
    }
  };

  render () {
    const { canSend, toAddress } = this.state

    return (
      <div>
        <div className='content row'>
          <div className='form-group w-100'>
            <div className='form-group w-100'>
              <label htmlFor='amount_input'>{i18n.t('send_to_address.to_address')}</label>
              <AddressBar
                buttonStyle={this.props.buttonStyle}
                toAddress={this.state.toAddress}
                setToAddress={(toAddress) => { this.updateState('toAddress', toAddress) }}
                openScanner
                addressInput={(input) => { this.addressInput = input }}
              />
            </div>
            <div>  {this.state.toAddress && this.state.toAddress.length === 42 &&
              <CopyToClipboard text={toAddress.toLowerCase()}>
                <div style={{ cursor: 'pointer' }} onClick={() => this.props.changeAlert({ type: 'success', message: toAddress.toLowerCase() + ' copied to clipboard' })}>
                  <div style={{ opacity: 0.33 }}>{this.state.fromEns}</div>
                  <Blockies seed={toAddress.toLowerCase()} scale={10} />
                </div>
              </CopyToClipboard>}
            </div>
            <label htmlFor='amount_input'>{i18n.t('send_to_address.send_amount')}</label>
            <AmountBar
              ref={(input) => { this.amountInput = input }}
              buttonStyle={this.props.buttonStyle}
              unit={this.props.token ? 'f' + this.props.token.shortName : i18n.t('loading')}
              value={this.state.amount}
              updateValue={amount => this.updateState('amount', amount)}
              maxValue={typeof this.props.offchainBalance !== 'undefined' && fromWei(this.props.offchainBalance.toString(), 'ether')}
              minValue='0'
            />
          </div>
        </div>
        <button
          name='theVeryBottom' className={`btn btn-lg w-100 ${canSend ? '' : 'disabled'}`} style={this.props.buttonStyle.primary}
          onClick={this.handleSend}
        >
            Send
        </button>
      </div>
    )
  }
}
