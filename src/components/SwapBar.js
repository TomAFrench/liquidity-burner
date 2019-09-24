import React from 'react';
import Ruler from "./Ruler";
import Blockies from 'react-blockies';
import { Scaler } from "dapparatus";

import i18n from '../i18n';

import InputRange from 'react-input-range';
import 'react-input-range/lib/css/index.css';
import core from '../core';

const { toWei, fromWei, toBN } = require('web3-utils');


const logoStyle = {
  maxWidth:50,
  maxHeight:50,
}

const colStyle = {
  textAlign:"center",
  whiteSpace:"nowrap"
}

export default class SwapBar extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      ethToDaiMode: false,
      loaderBarStatusText: i18n.t('loading'),
      loaderBarStartTime:Date.now(),
      loaderBarPercent: 2,
      loaderBarColor: "#aaaaaa",
      gwei: 5,
      maxWithdrawlAmount: 0.00,
      withdrawalExplanation: i18n.t('exchange.withdrawal_explanation'),
    }
  }
  updateState = (key, value) => {
    this.setState({ [key]: value },()=>{
    });
  };

  render() {
    let {ethToDaiMode} = this.state

    let ethCancelButton = (
      <span style={{padding:10,whiteSpace:"nowrap"}}>
        <a href="#" style={{color:"#000000"}} onClick={()=>{
          this.setState({amount:"",ethToDaiMode:false})
        }}>
          <i className="fas fa-times"/> {i18n.t('cancel')}
        </a>
      </span>
    )

    let buttonsDisabled = (
      ethToDaiMode=="depositing" || ethToDaiMode=="withdrawing"
    )

    let adjustedFontSize = Math.round((Math.min(document.documentElement.clientWidth,600)/600)*24)
    let adjustedTop = Math.round((Math.min(document.documentElement.clientWidth,600)/600)*-20)+9

    let ethToDaiDisplay =  i18n.t('loading')

    if(ethToDaiMode=="depositing" || ethToDaiMode=="withdrawing"){
      ethToDaiDisplay = (
        <div className="content ops row" style={{position:"relative"}}>
          <button style={{width:Math.min(100,this.state.loaderBarPercent)+"%",backgroundColor:this.state.loaderBarColor,color:"#000000"}}
            className="btn btn-large"
          >
          </button>
          <div style={{position:'absolute',left:"50%",width:"100%",marginLeft:"-50%",fontSize:adjustedFontSize,top:adjustedTop,opacity:0.95,textAlign:"center"}}>
            {this.state.loaderBarStatusText}
          </div>
        </div>
      )

    }else if(ethToDaiMode=="deposit"){
      ethToDaiDisplay = (
        <div className="content ops row">

          <div className="col-1 p-1"  style={colStyle}>
            <i className="fas fa-arrow-up"  />
          </div>
          <div className="col-6 p-1" style={colStyle}>
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <div className="input-group">
              <div className="input-group-prepend">
                <div className="input-group-text">$</div>
              </div>
              <input type="number" step="0.1" className="form-control" placeholder="0.00" value={this.state.amount}
                      onChange={event => this.updateState('amount', event.target.value)} />
                <div className="input-group-append" onClick={ event => this.updateState('amount', fromWei(this.props.onchainBalance, "ether"))}>
                  <span className="input-group-text" id="basic-addon2" style={this.props.buttonStyle.secondary}>
                    max
                  </span>
                </div>
            </div>
            </Scaler>
          </div>
          <div className="col-2 p-1"  style={colStyle}>
            <Scaler config={{startZoomAt:650,origin:"0% 85%"}}>
            {ethCancelButton}
            </Scaler>
          </div>
          <div className="col-3 p-1">
            <button className="btn btn-large w-100" disabled={buttonsDisabled} style={this.props.buttonStyle.primary} onClick={async ()=>{

              //Deposit onto hub

              // this.setState({
              //   ethToDaiMode:"depositing",
              //   loaderBarColor:"#3efff8",
              //   loaderBarStatusText: i18n.t('exchange.calculate_gas_price'),
              //   loaderBarPercent:0,
              //   loaderBarStartTime: Date.now(),
              //   loaderBarClick:()=>{
              //     alert(i18n.t('exchange.go_to_etherscan'))
              //   }
              // })
              this.props.deposit(toWei(this.state.amount, "ether"))
              this.setState({ethToDaiMode:false})
            }}>
              <Scaler config={{startZoomAt:600,origin:"10% 50%"}}>
                <i className="fas fa-arrow-up" /> Send
              </Scaler>
            </button>

          </div>
        </div>
      )

    }else if(ethToDaiMode=="withdraw"){
      if(this.props.ethBalance<=0){
        ethToDaiDisplay = (
          <div className="content ops row" style={{textAlign:'center'}}>
            <div className="col-12 p-1">
              Error: You must have ETH to withdraw DAI.
              <a href="#" onClick={()=>{this.setState({ethToDaiMode:false})}} style={{marginLeft:40,color:"#666666"}}>
                <i className="fas fa-times"/> dismiss
              </a>
            </div>
          </div>
        )
      }else{
        ethToDaiDisplay = (
          <div className="content ops row">

            <div className="col-1 p-1"  style={colStyle}>
              <i className="fas fa-arrow-down"  />
            </div>
            <div className="col-6 p-1" style={colStyle}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="number" step="0.1" className="form-control" placeholder="0.00" value={this.state.amount}
                       onChange={event => this.updateState('amount', event.target.value)} />
               <div className="input-group-append" onClick={event => this.updateState('amount', fromWei(this.props.offchainBalance, "ether"))}>
                 <span className="input-group-text" id="basic-addon2" style={this.props.buttonStyle.secondary}>
                   max
                 </span>
               </div>
              </div>
              </Scaler>
            </div>
            <div className="col-2 p-1"  style={colStyle}>
              <Scaler config={{startZoomAt:650,origin:"0% 85%"}}>
              {ethCancelButton}
              </Scaler>
            </div>
            <div className="col-3 p-1">
              <button className="btn btn-large w-100" disabled={buttonsDisabled} style={this.props.buttonStyle.primary} onClick={async ()=>{

                //Withdraw from hub

                // this.setState({
                //   ethToDaiMode:"withdrawing",
                //   loaderBarColor:"#3efff8",
                //   loaderBarStatusText: i18n.t('exchange.calculate_gas_price'),
                //   loaderBarPercent:0,
                //   loaderBarStartTime: Date.now(),
                //   loaderBarClick:()=>{
                //     alert(i18n.t('exchange.go_to_etherscan'))
                //   }
                // })

                
                this.props.requestWithdraw(toWei(this.state.amount, "ether"))
                this.setState({ethToDaiMode:false})
              }

              }>
                <Scaler config={{startZoomAt:600,origin:"10% 50%"}}>
                  <i className="fas fa-arrow-down" /> Send
                </Scaler>
              </button>
            </div>
          </div>
        )
      }

    }else{
      ethToDaiDisplay = (
         <div className="content ops row">

           <div className="col-6 p-1">
             <button className="btn btn-large w-100"  style={this.props.buttonStyle.primary} disabled={buttonsDisabled}  onClick={()=>{
               this.setState({ethToDaiMode:"deposit"})
             }}>
               <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-arrow-up"  /> {this.props.text} to f{this.props.text}
               </Scaler>
             </button>
           </div>

           <div className="col-6 p-1">
             <button className="btn btn-large w-100"  style={this.props.buttonStyle.primary} disabled={buttonsDisabled}  onClick={()=>{
               this.setState({ethToDaiMode:"withdraw"})
             }}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
               <i className="fas fa-arrow-down" /> f{this.props.text} to {this.props.text}
              </Scaler>
             </button>
           </div>
         </div>
       )

    }

  
    //console.log("eth price ",this.props.ethBalance,this.props.ethprice)
    return (
      <div className="main-card card w-100">
        {ethToDaiDisplay}
      </div>
    )
  }
}
