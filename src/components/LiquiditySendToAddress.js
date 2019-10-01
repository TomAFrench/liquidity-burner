import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";
import cookie from 'react-cookies'
import {CopyToClipboard} from "react-copy-to-clipboard";
import Blockies from 'react-blockies';
import { scroller } from 'react-scroll'
import i18n from '../i18n';
const queryString = require('query-string');
const { toWei, fromWei, toBN } = require('web3-utils');

export default class LiquiditySendToAddress extends React.Component {

  constructor(props) {
    super(props);



    console.log("!!!!!!!!!!!!!!!!!!!!!!!! window.location.search",window.location.search,parsed)

    let startAmount = props.amount
    if(props.scannerState) startAmount = props.scannerState.amount
    if(!startAmount) {
      startAmount = cookie.load('sendToStartAmount')
    }else{
      cookie.save('sendToStartAmount', startAmount, { path: '/', maxAge: 60 })
    }

    let toAddress = ""
    if(props.scannerState) toAddress = props.scannerState.toAddress
    if(!toAddress) {
      toAddress = cookie.load('sendToAddress')
    }else{
      cookie.save('sendToAddress', toAddress, { path: '/', maxAge: 60 })
    }

    let initialState = {
      amount: startAmount,
      toAddress: toAddress,
      fromEns: "",
      canSend: false,
    }

    let startingAmount = 0.15
    if(props.amount){
      startingAmount = props.amount
    }
    if(window.location.pathname){
      if(window.location.pathname.length==43){
        initialState.toAddress = window.location.pathname.substring(1)
      }else if(window.location.pathname.length>40) {
      //    console.log("window.location.pathname",window.location.pathname)
      //  console.log("parseAndCleanPath...")
        initialState = Object.assign(initialState,this.props.parseAndCleanPath(window.location.pathname))
      //  console.log("parseAndCleanPath:",initialState)
      }
    }

    const parsed = queryString.parse(window.location.search);
    if(parsed){
      initialState.params = parsed
    }

    this.state = initialState
  //  console.log("SendToAddress constructor",this.state)
    window.history.pushState({},"", "/");



  }

  updateState = async (key, value) => {
    if(key=="amount"){
      cookie.save('sendToStartAmount', value, { path: '/', maxAge: 60 })
    }
    else if(key=="toAddress"){
      cookie.save('sendToAddress', value, { path: '/', maxAge: 60 })
    }
    this.setState({ [key]: value },()=>{
      this.setState({ canSend: this.canSend() },()=>{
        if(key!="message"){
          this.bounceToAmountIfReady()
        }
      })
    });
    if(key=="toAddress"){
      this.setState({fromEns:""})
      //setTimeout(()=>{
      //  this.scrollToBottom()
      //},30)
    }
    if(key=="toAddress"&&value.indexOf(".eth")>=0){
      console.log("Attempting to look up ",value)
      let addr = await this.props.ensLookup(value)
      console.log("Resolved:",addr)
      if(addr!="0x0000000000000000000000000000000000000000"){
        this.setState({toAddress:addr,fromEns:value},()=>{
          if(key!="message"){
            this.bounceToAmountIfReady()
          }
        })
      }
    }
  };
  bounceToAmountIfReady(){
    if(this.state.toAddress && this.state.toAddress.length === 42){
      this.amountInput.focus();
    }
  }
  componentDidMount(){
    this.setState({ canSend: this.canSend() })
    setTimeout(()=>{
      if(!this.state.toAddress && this.addressInput){
        this.addressInput.focus();
      }else if(!this.state.amount && this.amountInput){
        this.amountInput.focus();
      }else if(this.messageInput){
        this.messageInput.focus();
        setTimeout(()=>{
          this.scrollToBottom()
        },30)
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
    return (this.state.toAddress && this.state.toAddress.length === 42 && this.state.amount >= 0)
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
    let { toAddress, amount } = this.state;
    let { dollarDisplay, convertToDollar} = this.props

    amount = convertToDollar(amount)
    console.log("CONVERTED TO DOLLAR AMOUNT",amount)

    if(this.state.canSend){

      if (!this.state.amount){
        return false
      }
      let amountWei = toBN(toWei(this.state.amount, 'ether'))

      console.log("this.props.balance",parseFloat(this.props.offchainBalance),"amountWei",amountWei.toString())

      if(this.props.offchainBalance.lt(amountWei)){
        console.log("Not enough funds", this.props.offchainBalance.toString())
        this.props.changeAlert({type: 'warning', message: "Not enough funds"})
      }else{
        console.log("SWITCH TO LOADER VIEW...",amount)
        // this.props.changeView('loader')
        // setTimeout(()=>{window.scrollTo(0,0)},60)

        let value = 0
        console.log("amount",amount)
        if(amount){
          value=amount
        }

        cookie.remove('sendToStartAmount', { path: '/' })
        cookie.remove('sendToStartMessage', { path: '/' })
        cookie.remove('sendToAddress', { path: '/' })

        const transaction = {
          to: toAddress,
          from: this.props.address,
          amount: toWei(value, 'ether').toString(),
          tokenAddress: this.props.tokenAddress
        }

        console.log(transaction)
        
        this.props.nocustManager.sendTransaction(transaction)
        // console.log("transaction response", response)
        if (typeof this.props.onSend === 'function') {
          this.props.onSend()
        }
        this.props.goBack()
        
        // this.props.send(toAddress, value, 120000, txData, (result) => {
        //   if(result && result.transactionHash){
        //     this.props.goBack();
        //     window.history.pushState({},"", "/");
        //     /*
        //     this.props.changeAlert({
        //       type: 'success',
        //       message: 'Sent! '+result.transactionHash,
        //     });*/

        //     let receiptObj = {to:toAddress,from:result.from,amount:parseFloat(amount),message:this.state.message,result:result}


        //     if(this.state.params){
        //       receiptObj.params = this.state.params
        //     }

        //   //  console.log("CHECKING SCANNER STATE FOR ORDER ID",this.props.scannerState)
        //     if(this.props.scannerState&&this.props.scannerState.daiposOrderId){
        //       receiptObj.daiposOrderId = this.props.scannerState.daiposOrderId
        //     }

        //     //console.log("SETTING RECEPITE STATE",receiptObj)
        //     this.props.setReceipt(receiptObj)
        //     this.props.changeView("receipt");
        //   }
        // })
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
    if(this.props.scannerState&&this.props.scannerState.daiposOrderId){
      amountInputDisplay = (
        <input type="number" readOnly className="form-control" placeholder="0.00" value={this.state.amount}
            ref={(input) => { this.amountInput = input; }}
               onChange={event => this.updateState('amount', event.target.value)} />
      )
    }

    return (
      <div>
        <div className="content row">
          <div className="form-group w-100">
            <div className="form-group w-100">
              <label htmlFor="amount_input">{i18n.t('send_to_address.to_address')}</label>
              <div className="input-group">
                <input type="text" className="form-control" placeholder="0x..." value={this.state.toAddress}
                  ref={(input) => { this.addressInput = input; }}
                       onChange={event => this.updateState('toAddress', event.target.value)} />
                <div className="input-group-append" onClick={() => {
                  this.props.openScanner({view:"send_to_address"})
                }}>
                  <span className="input-group-text" id="basic-addon2" style={this.props.buttonStyle.primary}>
                    <i style={{color:"#FFFFFF"}} className="fas fa-qrcode" />
                  </span>
                </div>
              </div>
            </div>
            <div>  { this.state.toAddress && this.state.toAddress.length==42 &&
              <CopyToClipboard text={toAddress.toLowerCase()}>
                <div style={{cursor:"pointer"}} onClick={() => this.props.changeAlert({type: 'success', message: toAddress.toLowerCase()+' copied to clipboard'})}>
                  <div style={{opacity:0.33}}>{this.state.fromEns}</div>
                  <Blockies seed={toAddress.toLowerCase()} scale={10}/>
                </div>
              </CopyToClipboard>
            }</div>
            <label htmlFor="amount_input">{i18n.t('send_to_address.send_amount')}</label>
            <div className="input-group">
              <div className="input-group-prepend">
                <div className="input-group-text">{dollarSymbol}</div>
              </div>
              {amountInputDisplay}
            </div>
          </div>
        </div>
        <button name="theVeryBottom" className={`btn btn-lg w-100 ${canSend ? '' : 'disabled'}`} style={this.props.buttonStyle.primary}
                  onClick={this.send}>
            Send
          </button>
      </div>
    )
  }
}
