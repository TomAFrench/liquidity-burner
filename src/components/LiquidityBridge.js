import React, { useState } from 'react';
import { Scaler } from "dapparatus";
import Ruler from "./Ruler";
import Blockies from 'react-blockies'
import SwapBar from './SwapBar'

const { toWei, toBN } = require('web3-utils');

const logoStyle = {
  maxWidth:50,
  maxHeight:50,
}

const DisplayBar = (props) => {
  let sendButton = (
    <button className="btn btn-large w-100" disabled={props.buttonsDisabled} style={props.buttonStyle.secondary} onClick={()=>{
      props.enableSend()
    }}>
      <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
        <i className="fas fa-arrow-right"></i>
      </Scaler>
    </button>
  )

  const cancelButton = (
    <button className="btn btn-large w-100" style={{backgroundColor:"#888888",whiteSpace:"nowrap"}} onClick={()=>{props.cancelSend()}}>
      <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
        <i className="fas fa-times"></i>
      </Scaler>
    </button>
  )

  return (
    <div className="content ops row" style={{paddingBottom:20}}>
      <div className="col-2 p-1">
        <img style={logoStyle} src={props.icon} />
      </div>
      <div className="col-3 p-1" style={{marginTop:10}}>
        {props.text}
      </div>
      <div className="col-4 p-1" style={{marginTop:10,whiteSpace:"nowrap"}}>
        <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
          {props.amount}
        </Scaler>
      </div>
      <div className="col-3 p-1" style={{marginTop:8}}>
        { !props.disableSending ? (props.sending ? cancelButton : sendButton) : ""}
      </div>
    </div>
  )
}

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
