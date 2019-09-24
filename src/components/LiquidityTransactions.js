import React from 'react';
import { Blockie } from "dapparatus";
import Ruler from "./Ruler";
import { Scaler } from "dapparatus";
const { toWei, fromWei } = require('web3-utils');

export default ({dollarDisplay, view, max, buttonStyle, address, recentTxs, changeView}) => {
  let txns = []
  let count=0
  if(!max) max=9999
  for(let r in recentTxs){

    let dollarView = (
      <span>
        <span style={{opacity:0.33}}>-</span>{fromWei(recentTxs[r].amount.toString(), 'ether')}<span style={{opacity:0.33}}>-></span>
      </span>
    )

    let toBlockie = (
      <Blockie
        address={recentTxs[r].recipient.address}
        config={{size:4}}
      />
    )

    if(count++<max){
      //if(txns.length>0){
        txns.push(
          <hr key={"ruler"+recentTxs[r].tx_id} style={{ "color": "#DFDFDF",marginTop:0,marginBottom:7 }}/>
        )
      //}

      let blockAge = (Date.now() - recentTxs[r].timestamp) / 1000

      txns.push(
        // <div key={count} style={{position:'relative',cursor:'pointer'}} key={recentTxs[r].hash} className="content bridge row" >
        <div key={recentTxs[r].tx_id} style={{position:'relative'}}  className="content bridge row" >
          <div className="col-3 p-1" style={{textAlign:'center'}}>
            <Blockie
              address={recentTxs[r].wallet.address}
              config={{size:4}}
            />
          </div>
          <div className="col-3 p-1" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1}}>
            <Scaler config={{startZoomAt:600,origin:"25% 50%",adjustedZoom:1}}>
              {dollarView}
            </Scaler>
          </div>
          <div className="col-3 p-1" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1}}>
            {toBlockie}
          </div>
          <div className="col-2 p-1" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1}}>
            <Scaler config={{startZoomAt:600,origin:"25% 50%",adjustedZoom:1}}>
              <span style={{marginLeft:5,marginTop:-5,opacity:0.4,fontSize:12}}>{cleanTime((blockAge))} ago</span>
            </Scaler>
          </div>

        </div>
      )
    }
  }
  if(txns.length>0){
    return (
      <div style={{marginTop:30}}>
        {txns}
      </div>
    )
  }else{
    return (
      <span></span>
    )
  }
}

let cleanTime = (s)=>{
  if(s<60){
    return s+"s"
  }else if(s/60<60){
    return Math.round(s/6)/10+"m"
  }else {
    return Math.round((s/60/6)/24)/10+"d"
  }
}
