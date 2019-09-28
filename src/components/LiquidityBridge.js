import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";
import SwapBar from './SwapBar'

const { toWei } = require('web3-utils');

export default class LiquidityBridge extends React.Component {

  render() {
    return (
      <div>
        <Balance
          icon={this.props.image}
          selected={true}
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
          deposit={(amount) => {this.props.nocust.approveAndDeposit(this.props.address, amount, toWei("1", "gwei"), "300000", this.props.tokenAddress)}}
          requestWithdraw={(amount) => {this.props.nocust.withdrawalRequest(this.props.address, amount, toWei("1", "gwei"), "300000", this.props.tokenAddress)}}
        />
        <Balance
          icon={this.props.image}
          selected={true}
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
