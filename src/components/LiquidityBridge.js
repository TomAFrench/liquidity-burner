import React, { useState } from 'react';
import { Scaler } from "dapparatus";
import Ruler from "./Ruler";
import Blockies from 'react-blockies'
import Balance from "./Balance";
import SwapBar from './SwapBar'
import AddressBar from './AddressBar';
import AmountBar from './AmountBar';


const { fromWei, toWei, toBN } = require('web3-utils');

export default class LiquidityBridge extends React.Component {

  render() {
    const gasLimit = "300000"
    return (
      <div>
        <Balance
          token={this.props.token}
          balance={this.props.balance}
          offchain
          selected
          address={this.props.account}
          dollarDisplay={(balance)=>{return balance}}
        />
        <Ruler/>
        <SwapBar
          buttonStyle={this.props.buttonStyle}
          text={this.props.token.shortName}
          ethBalance={this.props.ethBalance}
          onchainBalance={this.props.onchainBalance}
          offchainBalance={this.props.offchainBalance}
          withdrawLimit={this.props.withdrawLimit}
          deposit={(amount) => {this.props.nocust.approveAndDeposit(this.props.address, amount, this.props.gasPrice, gasLimit, this.props.token.tokenAddress)}}
          requestWithdraw={(amount) => {this.props.nocust.withdrawalRequest(this.props.address, amount, this.props.gasPrice, gasLimit, this.props.token.tokenAddress)}}
        />
        <Balance
          token={this.props.token}
          balance={this.props.balance}
          selected
          address={this.props.account}
          dollarDisplay={(balance)=>{return balance}}
        />
        <Ruler/>
      </div>
    )
  }
}
