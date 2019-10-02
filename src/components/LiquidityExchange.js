import React, { useState } from 'react';
import { Scaler } from "dapparatus";
import Ruler from "./Ruler";
import DisplayBar from './DisplayBar'
import AmountBar from './AmountBar'
import i18n from '../i18n';

const { toWei, fromWei, toBN } = require('web3-utils');

const colStyle = {
  textAlign:"center",
  whiteSpace:"nowrap"
}

const TEXSwapper = (props) => {
  
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");

  let cancelButton = (
    <span style={{padding:10,whiteSpace:"nowrap"}}>
      <a href="#" style={{color:"#000000"}} onClick={() => props.cancelAction()}>
        <i className="fas fa-times"/> {i18n.t('cancel')}
      </a>
    </span>
  )

  return (
    <div className="content ops row">

      <div className="col-1 p-1"  style={colStyle}>
        <i className={`fas ${props.icon}`}  />
      </div>
      <div className="col-3 p-1" style={colStyle}>
      {props.assetBuyText}
        <AmountBar
          buttonStyle={props.buttonStyle}
          value={buyAmount}
          updateValue={amount => setBuyAmount(amount)}
        />
      </div>
      <div className="col-3 p-1" style={colStyle}>
        {props.assetSellText}
        <AmountBar
          buttonStyle={props.buttonStyle}
          value={sellAmount}
          updateValue={amount => setSellAmount(amount)}
          maxValue={props.assetBalance}
        />
      </div>
      <div className="col-2 p-1"  style={colStyle}>
        <Scaler config={{startZoomAt:650,origin:"0% 85%"}}>
        {cancelButton}
        </Scaler>
      </div>
      <div className="col-3 p-1">
        <button className="btn btn-large w-100" disabled={props.buttonsDisabled} style={props.buttonStyle.primary} onClick={async ()=>{
          props.successAction(buyAmount, sellAmount)
        }}>
          <Scaler config={{startZoomAt:600,origin:"10% 50%"}}>
            <i className={`fas ${props.icon}`} /> Send
          </Scaler>
        </button>

      </div>
    </div>
  )
}

const TEXSwapBar = (props) => {

  const [swapMode, setSwapMode] = useState(false)

  let display =  i18n.t('loading')

  if (swapMode === "AtoB"){
    display = (
      <TEXSwapper 
        icon={"fa-arrow-down"}
        buttonStyle={props.buttonStyle}
        assetSellText={props.assetAText}
        assetBuyText={props.assetBText}
        assetBalance={props.assetABalance}
        successAction={(buyAmount, sellAmount) => {
          console.log("Buying ", buyAmount, props.assetBText, " for ", sellAmount, props.assetAText)
          props.AtoBTrade(toWei(buyAmount, "ether"), toWei(sellAmount, "ether"))
          setSwapMode(false)
        }}
        cancelAction={() => {
          setSwapMode(false)
        }}
      />
    )
  } else if (swapMode === "BtoA") {
    display = (
      <TEXSwapper 
        icon={"fa-arrow-up"}
        buttonStyle={props.buttonStyle}
        assetSellText={props.assetBText}
        assetBuyText={props.assetAText}
        assetBalance={props.assetBBalance}
        successAction={(buyAmount, sellAmount) => {
          console.log("Buying ", buyAmount, props.assetAText, " for ", sellAmount, props.assetBText)
          props.BtoATrade(toWei(buyAmount, "ether"), toWei(sellAmount, "ether"))
          setSwapMode(false)
        }}
        cancelAction={() => {
          setSwapMode(false)
        }}
      />
    )
  } else { 
    display = (
        <div className="content ops row">
          <div className="col-6 p-1">
            <button
              className="btn btn-large w-100"
              style={props.buttonStyle.primary}
              onClick={()=>{
                setSwapMode("BtoA")
              }}
            >
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <i className="fas fa-arrow-up"  /> {props.assetBText} to {props.assetAText}
              </Scaler>
            </button>
          </div>

          <div className="col-6 p-1">
            <button
              className="btn btn-large w-100"
              style={props.buttonStyle.primary}
              onClick={()=>{
                setSwapMode("AtoB")
                }}
            >
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-arrow-down" /> {props.assetAText} to {props.assetBText}
              </Scaler>
            </button>
          </div>  
        </div>
      )
  }

  return (
    <div className="main-card card w-100">
      {display}
    </div>
  )
}

export default class LiquidityExchange extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
    }
    this.getOrderBook()
  }

  componentDidMount(props) {
    this.syncSwaps()

    const syncIntervalId = setInterval(this.syncSwaps.bind(this),10000)
    this.setState({syncIntervalId})
  }

  componentWillUnmount() {
    console.log("Stopping checking for fulfilled swaps")
    clearInterval(this.state.syncIntervalId)
  }

  async getOrderBook(){
    const orderbook = await this.props.nocust.getOrderBook(this.props.assetBAddress, this.props.assetAAddress)
    this.setState({orderbook})
  }

  async syncSwaps(){
    console.log("Getting swaps for", this.props.address)
    const swapresonse = await this.props.nocust.synchronizeSwapOrders(this.props.address)
    console.log("Swap response", swapresonse)
  }

  AtoBTrade(buyAmount, sellAmount) {
    this.props.nocust.sendSwap(this.props.address, this.props.assetBAddress, this.props.assetAAddress, buyAmount, sellAmount)
  }

  BtoATrade(buyAmount, sellAmount) {
    this.props.nocust.sendSwap(this.props.address, this.props.assetAAddress, this.props.assetBAddress, buyAmount, sellAmount)
  }

  render() {
    return (
      <div>
        <DisplayBar
          icon={this.props.assetAImage}
          text={this.props.assetAText}
          amount={this.props.assetADisplay}
          buttonStyle={this.props.buttonStyle}
          disableSending
        />
        <Ruler/>
        <TEXSwapBar
          buttonStyle={this.props.buttonStyle}
          assetAText={this.props.assetAText}
          assetBText={this.props.assetBText}
          assetABalance={this.props.assetABalance}
          assetBBalance={this.props.assetBBalance}
          assetADisplay={this.props.assetADisplay}
          assetBDisplay={this.props.assetBDisplay}
          AtoBTrade={(buyAmount, sellAmount) => this.AtoBTrade(buyAmount, sellAmount)}
          BtoATrade={(buyAmount, sellAmount) => this.BtoATrade(buyAmount, sellAmount)}
        />
        <DisplayBar
          icon={this.props.assetBImage}
          text={this.props.assetBText}
          amount={this.props.assetBDisplay}
          buttonStyle={this.props.buttonStyle}
          disableSending
        />
        <Ruler/>
      </div>
    )
  }
}