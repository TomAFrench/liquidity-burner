import React from 'react';
import { Scaler } from "dapparatus";

const logoStyle = {
  maxWidth:50,
  maxHeight:50,
}


const DisplayBar = (props) => {
  let sendButton = (
    <button className="btn btn-large w-100" disabled={props.buttonsDisabled} style={props.buttonStyle.secondary} onClick={()=>{
      props.enableSend()
    }}>
      <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
        <i className="fas fa-arrow-right"></i>
      </Scaler>
    </button>
  )

  const cancelButton = (
    <button className="btn btn-large w-100" style={{backgroundColor:"#888888",whiteSpace:"nowrap"}} onClick={()=>{props.cancelSend()}}>
      <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
        <i className="fas fa-times"></i>
      </Scaler>
    </button>
  )

  return (
    <div className="content ops row" style={{paddingBottom:20}}>
      <div className="col-2 p-1">
        <img style={logoStyle} src={props.icon} />
      </div>
      <div className="col-3 p-1" style={{marginTop:10}}>
        {props.text}
      </div>
      <div className="col-4 p-1" style={{marginTop:10,whiteSpace:"nowrap"}}>
        <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
          {props.amount}
        </Scaler>
      </div>
      <div className="col-3 p-1" style={{marginTop:8}}>
        { !props.disableSending ? (props.sending ? cancelButton : sendButton) : ""}
      </div>
    </div>
  )
}

export default DisplayBar