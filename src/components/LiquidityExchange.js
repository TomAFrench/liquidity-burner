import React, { useState } from 'react';
import { Scaler } from "dapparatus";
import Ruler from "./Ruler";
import Balance from "./Balance";
import AmountBar from './AmountBar'
import i18n from '../i18n';

const { toWei, fromWei, toBN } = require('web3-utils');

const colStyle = {
  textAlign:"center",
  whiteSpace:"nowrap"
}

const rowStyle = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'nowrap',
  alignItems: 'center',
  justifyContent: 'space-between'
}

const flexColStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  justifyContent: 'space-evenly'
}

const TEXSwapper = (props) => {
  
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");

  const [maxInput, maxOutput] = getMaxOutputs(props.orders, props.assetBalance)

  let cancelButton = (
    <span style={{padding:10,whiteSpace:"nowrap"}}>
      <a href="#" style={{color:"#000000"}} onClick={() => props.cancelAction()}>
        <i className="fas fa-times"/> {i18n.t('cancel')}
      </a>
    </span>
  )

  const buyAmountBar = (
    <AmountBar
      buttonStyle={props.buttonStyle}
      unit={props.assetBuyText}
      value={buyAmount}
      updateValue={amount => {
        setBuyAmount(amount)
        if (amount && typeof props.orders !== 'undefined') {
          setSellAmount(fromWei(getAmountIn(props.orders, toWei(amount,'ether')),'ether'))
        }
        }
      }
      maxValue={fromWei(maxOutput.toString(), 'ether')}
      minValue={"0"}
    />
  )

  const sellAmountBar = (
    <AmountBar
      buttonStyle={props.buttonStyle}
      unit={props.assetSellText}
      value={sellAmount}
      updateValue={amount => {
        setSellAmount(amount)
        if (amount && typeof props.orders !== 'undefined') {
          setBuyAmount(fromWei(getAmountOut(props.orders, toWei(amount,'ether')),'ether'))
        }
        }
      }
      maxValue={fromWei(maxInput.toString(), 'ether')}
      minValue={"0"}
    />
  )

  return (
    <div className="content ops row" style={rowStyle}>

      <div className="col-1 p-1"  style={colStyle}>
        <i className={`fas ${props.icon}`}  />
      </div>
      <div className="col-6 p-1" style={flexColStyle}>
        <div style={{flexGrow: 1}}>
          {props.reversed ? buyAmountBar : sellAmountBar}
        </div>
        <div style={{flexGrow: 1}}>
          {props.reversed ? sellAmountBar : buyAmountBar}
        </div>
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
        orders={props.orderbook.sell_orders}
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
        reversed
        icon={"fa-arrow-up"}
        buttonStyle={props.buttonStyle}
        orders={props.orderbook.buy_orders}
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

const getMaxOutputs = (orders, amount) => {
  if (!orders.length) {
    return ['0', '0']
  }
  let amountRemaining = (typeof amount !== 'undefined' ? toBN(amount) : toBN('0'))
  let maxIn = toBN("0")
  let maxOut = toBN("0")
  for (var i = 0; i < orders.length; i++) {
    const order = orders[i]

    if (amountRemaining.gte(toBN(order.remaining_in))) {
      maxIn.iadd(toBN(order.remaining_in))
      maxOut.iadd(toBN(order.remaining_out))
    } else {
      maxIn.iadd(toBN(amountRemaining))
      maxOut.iadd((toBN(order.remaining_out).mul(amountRemaining)).div(toBN(order.remaining_in)))
    }

    amountRemaining.isub(toBN(order.remaining_in))
    if (amountRemaining.lte(toBN('0'))){
      break
    }
  }
  return [maxIn, maxOut]
}

const getAmountIn = (orders, amountOut) => {
  return getOtherAmount(orders, amountOut, 'out')
}

const getAmountOut = (orders, amountIn) => {
  return getOtherAmount(orders, amountIn, 'in')
}

const getOtherAmount = (orders, amount, knownQuantity) => {
  let unknownQuantity
  if (knownQuantity === 'in') {
    knownQuantity = 'remaining_in'
    unknownQuantity = 'remaining_out'
  } else {
    knownQuantity = 'remaining_out'
    unknownQuantity = 'remaining_in'
  }

  let amountRemaining = toBN(amount)
  let orderIdx = 0
  let output = toBN("0")
  while (amountRemaining.gt(toBN("0"))) {
    try{
      const order = orders[orderIdx]
      if (amountRemaining.gte(toBN(order[knownQuantity]))) {
        output.iadd(toBN(order[unknownQuantity]))
      } else {
        output.iadd((toBN(order[unknownQuantity]).mul(amountRemaining)).div(toBN(order[knownQuantity])))
      }
      amountRemaining.isub(toBN(order[knownQuantity]))
      orderIdx += 1
    }
    catch(e) {
      throw "Not enough liquidity on exchange"
    }
  }
  return output
}

export default class LiquidityExchange extends React.Component {

  constructor(props) {
    super(props)
    this.state = {}
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
        <Balance
          icon={this.props.assetAImage}
          text={this.props.assetAText}
          amount={this.props.assetADisplay}
          address={this.props.account}
          dollarDisplay={(balance)=>{return balance}}
          />
        <Ruler/>
        <TEXSwapBar
          buttonStyle={this.props.buttonStyle}
          orderbook={this.state.orderbook}
          assetAText={this.props.assetAText}
          assetBText={this.props.assetBText}
          assetABalance={this.props.assetABalance}
          assetBBalance={this.props.assetBBalance}
          assetADisplay={this.props.assetADisplay}
          assetBDisplay={this.props.assetBDisplay}
          AtoBTrade={(buyAmount, sellAmount) => this.AtoBTrade(buyAmount, sellAmount)}
          BtoATrade={(buyAmount, sellAmount) => this.BtoATrade(buyAmount, sellAmount)}
        />
        <Balance
          icon={this.props.assetBImage}
          text={this.props.assetBText}
          amount={this.props.assetBDisplay}
          address={this.props.account}
          dollarDisplay={(balance)=>{return balance}}
          />
        <Ruler/>
      </div>
    )
  }
}
