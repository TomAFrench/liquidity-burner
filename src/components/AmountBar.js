import React from 'react';
import { Scaler } from "dapparatus";

import 'react-input-range/lib/css/index.css';

const { fromWei } = require('web3-utils');

export default (props) => {
  return (
    <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
    <div className="input-group">
      <div className="input-group-prepend">
        <div className="input-group-text">{props.unit}</div>
      </div>
      <input type="number" step="0.1" className="form-control" placeholder="0.00" value={props.value}
              onChange={event => props.updateValue(event.target.value)} />
      {typeof props.maxValue !== 'undefined' &&
      <div className="input-group-append" onClick={ event => {props.updateValue(fromWei(props.maxValue.toString(), "ether"))}}>
        <span className="input-group-text" id="basic-addon2" style={props.buttonStyle.secondary}>
          max
        </span>
      </div>
      }
    </div>
    </Scaler>
  )
}