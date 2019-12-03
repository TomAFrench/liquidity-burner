import React from 'react';
import {CopyToClipboard} from "react-copy-to-clipboard";
import i18n from '../i18n';

const QRCode = require('qrcode.react');
const { toWei } = require('web3-utils');
const qs = require('query-string');

export default class RequestFunds extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      amount: "",
      canRequest: false,
      requested: false
    }
  }

  updateState = (key, value) => {
    this.setState({ [key]: value },()=>{
      this.setState({ canRequest: (this.state.amount > 0) })
    });
  };

  request = () => {
    let { message, amount } = this.state;
    if(this.state.canRequest){
      this.setState({requested:true})
    }else{
      this.props.changeAlert({type: 'warning', message: 'Please enter a valid amount'})
    }
  };

  render() {
    let { canRequest, amount, requested } = this.state;
    let { address, buttonStyle, changeAlert, token, networkId} = this.props
    if(requested){

      const invoice = {
        network: networkId,
        publicKey: address,
        tokenAddress: token.tokenAddress,
        amount: toWei(amount, 'ether'),
      }

      const deeplinkRoot = 'lqdnet://send?'
      const qrValue = deeplinkRoot+qs.stringify(invoice)
      console.log("Request Link:", qrValue)
      

      let qrSize = Math.min(document.documentElement.clientWidth,512)-90


      return (
        <div>
          <CopyToClipboard text={qrValue} onCopy={() => {
            changeAlert({type: 'success', message: 'Request link copied to clipboard'})
          }}>
          <div style={{width:"100%",textAlign:'center'}}>
            <div style={{fontSize:30,cursor:"pointer",textAlign:"center",width:"100%"}}>
              {'f'+this.props.token.shortName + ' ' + amount}
            </div>

            <div style={{cursor:"pointer",textAlign:"center",width:"100%"}}>
              <QRCode value={qrValue} size={qrSize}/>
            </div>

            <div className="input-group">
              <input type="text" className="form-control" value={qrValue} disabled/>
              <div className="input-group-append">
                <span className="input-group-text"><i className="fas fa-copy"/></span>
              </div>
            </div>

            </div>
          </CopyToClipboard>
        </div>
      )
    }else{
      return (
        <div>
          <div className="content row">
            <div className="form-group w-100">
              <label htmlFor="amount_input">{i18n.t('request_funds.amount')}</label>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">{this.props.token ? 'f'+this.props.token.shortName : 'Loading...'}</div>
                </div>
                <input type="number" className="form-control" placeholder="0.00" value={this.state.amount}
                       onChange={event => this.updateState('amount', event.target.value)} />
              </div>
            </div>
            <button style={{backgroundColor:this.props.mainStyle.mainColor}} className={`btn btn-success btn-lg w-100 ${canRequest ? '' : 'disabled'}`}
                    onClick={this.request}>
              {i18n.t('request_funds.button')}
            </button>
          </div>

        </div>
      )
    }

  }
}