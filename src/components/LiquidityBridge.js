import React, { useState } from 'react';
import { Scaler } from "dapparatus";
import Ruler from "./Ruler";
import Blockies from 'react-blockies'
import Balance from "./Balance";
import SwapBar from './SwapBar'
import AddressBar from './AddressBar';
import AmountBar from './AmountBar';


const { fromWei, toWei, toBN } = require('web3-utils');

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
            <AddressBar
              buttonStyle={props.buttonStyle}
              toAddress={address}
              setToAddress={(toAddress) => { setAddress(toAddress) }}
            />
          </div>
          <div>  { validAddress && <Blockies seed={address.toLowerCase()} scale={10} /> }</div>
          <label htmlFor="amount_input">Send Amount</label>
          <AmountBar
            buttonStyle={props.buttonStyle}
            unit={props.unit}
            value={amount}
            updateValue={amount => setAmount(amount)}
            maxValue={typeof props.totalBalance !== 'undefined' ? fromWei(props.totalBalance.toString(), 'ether') : undefined}
            minValue={"0"}
          />
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

  render() {
    const gasLimit = "300000"
    return (
      <div>
        <Balance
          icon={this.props.image}
          text={"f"+this.props.text}
          amount={this.props.offchainDisplay}
          address={this.props.account}
          dollarDisplay={(balance)=>{return balance}}
          />
        <Ruler/>
        <SwapBar
          buttonStyle={this.props.buttonStyle}
          text={this.props.text}
          ethBalance={this.props.ethBalance}
          onchainBalance={this.props.onchainBalance}
          offchainBalance={this.props.offchainBalance}
          withdrawLimit={this.props.withdrawLimit}
          deposit={(amount) => {this.props.nocust.approveAndDeposit(this.props.address, amount, this.props.gasPrice, gasLimit, this.props.tokenAddress)}}
          requestWithdraw={(amount) => {this.props.nocust.withdrawalRequest(this.props.address, amount, this.props.gasPrice, gasLimit, this.props.tokenAddress)}}
        />
        <Balance
          icon={this.props.image}
          text={this.props.text}
          amount={this.props.onchainDisplay}
          address={this.props.account}
          dollarDisplay={(balance)=>{return balance}}
          />
        <Ruler/>
      </div>
    )
  }
}
