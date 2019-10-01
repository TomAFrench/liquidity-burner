import React, { useState } from 'react';
import { Scaler } from "dapparatus";
import Ruler from "./Ruler";
import Blockies from 'react-blockies'
import DisplayBar from './DisplayBar'
import SwapBar from './SwapBar'

const { toWei, toBN } = require('web3-utils');

const TransactionBar = (props) => {

  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  
  const validAddress = (address && address.length === 42)
  const validAmount = (amount && toBN(toWei(amount, 'ether')).gte('0') && toBN(toWei(amount, 'ether')).lte(toBN(props.totalBalance)))
  const canSend = validAddress && validAmount
  
  return (
    <div className="send-to-address card w-100" style={{marginTop:20}}>
      <div className="content ops row">
        <div className="form-group w-100">
          <div className="form-group w-100">
            <label htmlFor="amount_input">To Address</label>
            <input type="text" className="form-control" placeholder="0x..." value={address}
                  onChange={event => setAddress(event.target.value)} />
          </div>
          <div>  { validAddress && <Blockies seed={address.toLowerCase()} scale={10} /> }</div>
          <label htmlFor="amount_input">Send Amount</label>
          <div className="input-group">
            <div className="input-group-prepend">
              <div className="input-group-text">$</div>
            </div>
            <input type="number" step="0.1" className="form-control" placeholder="0.00" value={amount}
                  onChange={event => setAmount(event.target.value)} />
                  <div className="input-group-append" onClick={() => {setAmount(props.totalBalance)}}>
                    <span className="input-group-text" id="basic-addon2" style={props.buttonStyle.secondary}>
                      max
                    </span>
                  </div>
          </div>
          <button style={props.buttonStyle.primary} disabled={!canSend} className={`btn btn-success btn-lg w-100 ${canSend ? '' : 'disabled'}`}
                  onClick={() => props.onSend(address, toWei(amount, 'ether'))}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default class LiquidityBridge extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      sending: false
    }
  }

  render() {
    return (
      <div>
        <DisplayBar
          icon={this.props.image}
          text={"f"+this.props.text}
          amount={this.props.offchainDisplay}
          buttonStyle={this.props.buttonStyle}
          sending={this.state.sending}
          enableSend={() => this.setState({sending: true})}
          cancelSend={() => this.setState({sending: false})}

        />
        {this.state.sending &&
        <TransactionBar
        buttonStyle={this.props.buttonStyle}
        totalBalance={this.props.offchainBalance}
        onSend={(address, amount) => {
          this.props.nocust.sendTransaction({to: address, from: this.props.address, tokenAddress: this.props.tokenAddress, amount: amount})
          this.setState({sending: false})}}
        />}
        <Ruler/>
        <SwapBar
          buttonStyle={this.props.buttonStyle}
          text={this.props.text}
          ethBalance={this.props.ethBalance}
          onchainBalance={this.props.onchainBalance}
          offchainBalance={this.props.offchainBalance}
          withdrawLimit={this.props.withdrawLimit}
          deposit={(amount) => {this.props.nocust.approveAndDeposit(this.props.address, amount, toWei("1", "gwei"), "300000", this.props.tokenAddress)}}
          requestWithdraw={(amount) => {this.props.nocust.withdrawalRequest(this.props.address, amount, toWei("1", "gwei"), "300000", this.props.tokenAddress)}}
        />
        <DisplayBar
          icon={this.props.image}
          text={this.props.text}
          amount={this.props.onchainDisplay}
          buttonStyle={this.props.buttonStyle}
          disableSending
        />
        <Ruler/>
      </div>
    )
  }
}
