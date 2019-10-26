import React from 'react';
import Ruler from "./Ruler";

import {CopyToClipboard} from "react-copy-to-clipboard";
import Blockies from 'react-blockies';
import { scroller } from 'react-scroll'
import i18n from '../i18n';
const QRCode = require('qrcode.react');

export default class LiquidityReceive extends React.Component {

  constructor(props) {
    super(props);
    let initialState = {
    }
  }
  render() {
    let {buttonStyle, address, changeAlert, hubContract, hubApiUrl} = this.props


    let qrSize = Math.min(document.documentElement.clientWidth,512)-90
    let qrValue = address

    return (
        <div>
          <div className="send-to-address w-100">
            <CopyToClipboard text={address} onCopy={() => {
              changeAlert({type: 'success', message: i18n.t('receive.address_copied')})
            }}>
              <div className="content qr row" style={{cursor:"pointer"}}>
                <QRCode value={qrValue} size={qrSize}/>
                <div className="input-group">
                  <input type="text" className="form-control" style={{color:"#999999"}} value={address} disabled/>
                  <div className="input-group-append">
                    <span className="input-group-text"><i style={{color:"#999999"}}  className="fas fa-copy"/></span>
                  </div>
                </div>
              </div>
            </CopyToClipboard>
            <div style={{width:"100%",textAlign:'center',padding:20}}>
              <a href={"https://explorer.liquidity.network/?#/explorer?token=" + hubContract + "&address=" + address + "&url=" +hubApiUrl.replace(/\/$/, "")} target="_blank">
                View on Explorer
              </a>
            </div>
          </div>
        </div>
    )
            {/* <div name="theVeryBottom" className="text-center bottom-text">
          <span style={{padding:10}}>
            <a href="#" style={{color:"#FFFFFF"}} onClick={()=>{this.props.goBack()}}>
              <i className="fas fa-times"/> {i18n.t('cancel')}
            </a>
          </span>
        </div> */}
  }
}
