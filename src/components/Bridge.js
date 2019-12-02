import React from 'react';
import { useHistory } from "react-router-dom";

import Ruler from "./Ruler";
import Balance from "./Balance";
import SwapBar from './SwapBar'


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
        dollarDisplay={(balance)=>{return balance}}
      />
      <Ruler/>
      <SwapBar
        buttonStyle={props.buttonStyle}
        text={props.token ? props.token.shortName : "Loading..."}
        ethBalance={props.ethBalance}
        onchainBalance={props.balance.onchainBalance}
        offchainBalance={props.balance.offchainBalance}
        withdrawLimit={props.withdrawLimit}
        deposit={async (amount) => {
          try {
            await props.nocust.approveAndDeposit(props.address, amount, props.gasPrice, gasLimit, props.token.tokenAddress)
            history.push("/liquidity/sending", {title: "Sending " + props.token.shortName + " into the Liquidity Network...", subtitle: "Tokens can take between 5-10 minutes to appear on the hub"} )
            props.onSend()
          } catch (e) {
            console.log(e)
            props.changeAlert({type: 'warning', message: "Transaction Failed"})
          }      
        }}
        requestWithdraw={async (amount) => {
          try {
            await props.nocust.withdrawalRequest(props.address, amount, props.gasPrice, gasLimit, props.token.tokenAddress)
            history.push("/liquidity/sending", {title: "Requesting to withdraw " + props.token.shortName + " from the Liquidity Network...", subtitle: "Withdrawals can take up to 72 hours to become available to confirm onchain"} )
            props.onSend()
          } catch (e) {
            console.log(e)
            props.changeAlert({type: 'warning', message: "Transaction Failed"})
          }
        }}
      />
      <Balance
        token={props.token}
        balance={props.balance}
        selected
        dollarDisplay={(balance)=>{return balance}}
      />
      <Ruler/>
    </div>
  )
}
