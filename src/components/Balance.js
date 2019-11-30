import React from 'react';
import { Scaler } from "dapparatus";

export default ({token, selected, balance, offchain, dollarDisplay}) => {
  
  let opacity = 0.65
  if(selected){
    opacity=0.95
  }

  var amount = (offchain ? balance.displayOffchain : balance.displayOnchain)

  if(isNaN(amount) || typeof amount == "undefined"){
    amount=0.00
    opacity=0.25
  }

  if(opacity<0.9 && parseFloat(amount)<=0.0){
    opacity=0.05
  }

  let iconDisplay

    if(typeof token.image == "string" && token.image.length<8){
    iconDisplay = (
      <div style={{width:50,height:50,fontSize:42,paddingTop:13}}>
        {token.image}
      </div>
    )
  }else{
    iconDisplay = <img src={token.image} alt="Not available" style={{maxWidth:50,maxHeight:50}}/>
  }


  return (
    <div className="balance row" style={{opacity,paddingBottom:0,paddingLeft:20}}>
      <div className="avatar col p-0">
        {iconDisplay}
        <div style={{position:'absolute',left:60,top:12,fontSize:14,opacity:0.77, whiteSpace: 'nowrap'}}>
          {offchain? "f"+token.shortName : token.shortName }
        </div>
      </div>
      <div style={{position:"absolute",right:25,marginTop:15}}>
        <Scaler config={{startZoomAt:400,origin:"200px 30px",adjustedZoom:1}}>
          <div style={{fontSize:40,letterSpacing:-2}}>
            {dollarDisplay(amount)}
          </div>
        </Scaler>
      </div>
    </div>
  )
};
