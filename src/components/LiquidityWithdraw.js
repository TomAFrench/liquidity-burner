import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";
import cookie from 'react-cookies'
import {CopyToClipboard} from "react-copy-to-clipboard";
import Blockies from 'react-blockies';
import { scroller } from 'react-scroll'
import i18n from '../i18n';
const queryString = require('query-string');

const { toWei } = require('web3-utils');


export default class LiquidityWithdraw extends React.Component {

  constructor(props) {
    super(props);

    console.log("!!!!!!!!!!!!!!!!!!!!!!!! window.location.search",window.location.search)

    let startAmount = props.amount
    if(props.scannerState) startAmount = props.scannerState.amount
    if(!startAmount) {
      startAmount = cookie.load('withdrawStartAmount')
    }else{
      cookie.save('withdrawStartAmount', startAmount, { path: '/', maxAge: 60 })
    }

    let initialState = {
      amount: startAmount,
      fromEns: "",
      canSend: false,
    }

    this.state = initialState
  //  console.log("SendToAddress constructor",this.state)
    window.history.pushState({},"", "/");

  }

  updateState = async (key, value) => {
    if(key=="amount"){
      cookie.save('withdrawStartAmount', value, { path: '/', maxAge: 60 })
    }
    this.setState({ [key]: value }, ()=>{
      this.setState({ canSend: this.canSend() })
    })
  };

  componentDidMount(){
    this.setState({ canSend: this.canSend() })
    setTimeout(()=>{
      if(!this.state.amount && this.amountInput){
        this.amountInput.focus();
      }
    },350)
  }

  canSend() {
    /*const resolvedAddress = await this.ensProvider.resolveName(this.state.toAddress)
    console.log(`RESOLVED ADDRESS ${resolvedAddress}`)
    if(resolvedAddress != null){
      this.setState({
        toAddress: resolvedAddress
      })
    }*/
    return (this.state.amount>0 && this.state.amount < this.props.offchainBalance)
  }

  scrollToBottom(){
    console.log("scrolling to bottom")
    scroller.scrollTo('theVeryBottom', {
      duration: 500,
      delay: 30,
      smooth: "easeInOutCubic",
    })
  }

  send = async () => {
    let { amount } = this.state;
    let {ERC20TOKEN, dollarDisplay, convertToDollar} = this.props

    amount = convertToDollar(amount)
    console.log("CONVERTED TO DOLLAR AMOUNT",amount)

    if(this.state.canSend){
      if(ERC20TOKEN){
        console.log("this is a token")
      }else{
        console.log("this is not a token")
      }
      console.log("ERC20TOKEN",ERC20TOKEN,"this.props.balance",parseFloat(this.props.balance),"amount",parseFloat(amount))

      if(!ERC20TOKEN && parseFloat(this.props.offchainBalance) <= 0){
        console.log("No funds!?!", ERC20TOKEN, parseFloat(this.props.offchainBalance))
        this.props.changeAlert({type: 'warning', message: "No Offchain Funds."})
      // }else if(!ERC20TOKEN && parseFloat(this.props.balance)-0.0001<=parseFloat(amount)){
      //   let extraHint = ""
      //   if(!ERC20TOKEN && parseFloat(amount)-parseFloat(this.props.balance)<=.01){
      //     extraHint = "(gas costs)"
      //   }
      //   this.props.changeAlert({type: 'warning', message: 'Not enough funds: '+dollarDisplay(Math.floor((parseFloat(this.props.balance)-0.0001)*100)/100)+' '+extraHint})
      }else{
        // console.log("SWITCH TO LOADER VIEW...",amount)
        // this.props.changeView('loader')
        // setTimeout(()=>{window.scrollTo(0,0)},60)

        let value = 0
        console.log("amount",amount)
        if(amount){
          value=amount
        }

        cookie.remove('withdrawStartAmount', { path: '/' })        

        const gasPrice = toWei("10","gwei")
        const gasLimit = "300000"

        console.log(this.props.address, value, gasPrice, gasLimit)
        const txhash = await this.props.nocustManager.withdrawalRequest(this.props.address, value, gasPrice, gasLimit)
        console.log("transaction response", txhash)
        this.props.goBack()
      }
    }else{
      this.props.changeAlert({type: 'warning', message: i18n.t('send_to_address.error')})
    }
  };

  render() {
    let { canSend, toAddress } = this.state;
    let {dollarSymbol} = this.props

    let amountInputDisplay = (
      <input type="number" className="form-control" placeholder="0.00" value={this.state.amount}
          ref={(input) => { this.amountInput = input; }}
             onChange={event => this.updateState('amount', event.target.value)} />
    )

    return (
      <div>
        <Balance
          icon={this.props.icon}
          selected={true}
          text={this.props.text}
          amount={this.props.balance}
          address={this.props.account}
          dollarDisplay={this.props.dollarDisplay}
        />
        <Ruler/>
        <Balance
          icon={this.props.icon}
          selected={true}
          text={"f"+this.props.text}
          amount={this.props.offchainBalance}
          address={this.props.account}
          dollarDisplay={this.props.dollarDisplay}
        />
        <Ruler/>
        <div className="content row">
          <div className="form-group w-100">
            <label htmlFor="amount_input">{i18n.t('liquidity.withdraw.withdraw_amount')}</label>
            <div className="input-group">
              <div className="input-group-prepend">
                <div className="input-group-text">{dollarSymbol}</div>
              </div>
              {amountInputDisplay}
            </div>
          </div>
          <button name="theVeryBottom" className={`btn btn-lg w-100 ${canSend ? '' : 'disabled'}`} style={this.props.buttonStyle.primary}
                  onClick={this.send}>
            {i18n.t('liquidity.withdraw.confirm')}
          </button>
        </div>
      </div>
    )
  }
}
