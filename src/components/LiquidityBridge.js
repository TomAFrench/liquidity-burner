import React, { useState } from 'react';
import { useHistory } from "react-router-dom";

import { Scaler } from "dapparatus";
import Ruler from "./Ruler";
import Blockies from 'react-blockies'
import Balance from "./Balance";
import SwapBar from './SwapBar'
import AddressBar from './AddressBar';
import AmountBar from './AmountBar';


const { fromWei, toWei, toBN } = require('web3-utils');

export default (props) => {
  let history = useHistory();

  const gasLimit = "300000"
  return (
    <div>
      <Balance
        token={props.token}
        balance={props.balance}
        offchain
        selected
        address={props.account}
        dollarDisplay={(balance)=>{return balance}}
      />
      <Ruler/>
      <SwapBar
        buttonStyle={props.buttonStyle}
        text={props.token.shortName}
        ethBalance={props.ethBalance}
        onchainBalance={props.onchainBalance}
        offchainBalance={props.offchainBalance}
        withdrawLimit={props.withdrawLimit}
        deposit={async (amount) => {
          try {
            await props.nocust.approveAndDeposit(props.address, amount, props.gasPrice, gasLimit, props.token.tokenAddress)
            history.push("/liquidity/sending", {title: "Sending " + props.token.shortName + " into the Liquidity Network...", subtitle: "Tokens can take between 5-10 minutes to appear on the hub"} )
          } catch (e) {
            props.changeAlert({type: 'warning', message: "Transaction Failed"})
          }      
        }}
        requestWithdraw={async (amount) => {
          try {
            await props.nocust.withdrawalRequest(props.address, amount, props.gasPrice, gasLimit, props.token.tokenAddress)
            history.push("/liquidity/sending", {title: "Requesting to withdraw " + props.token.shortName + " from the Liquidity Network...", subtitle: "Withdrawals can take up to 72 hours to become available to confirm onchain"} )
          } catch (e) {
            props.changeAlert({type: 'warning', message: "Transaction Failed"})
          }
        }}
      />
      <Balance
        token={props.token}
        balance={props.balance}
        selected
        address={props.account}
        dollarDisplay={(balance)=>{return balance}}
      />
      <Ruler/>
    </div>
  )
}
