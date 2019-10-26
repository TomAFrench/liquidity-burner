import React from 'react';
import { Link } from "react-router-dom";

const AddressBar = (props) => {

  return (
    <div className="input-group">
      <input type="text" className="form-control" placeholder="0x..." value={props.toAddress}
        ref={(input) => { if (typeof props.addressInput === 'function') { props.addressInput(input) }}}
            onChange={event => props.setToAddress(event.target.value)} />
      { props.openScanner &&
        <div className="input-group-append">
          <div className="input-group-text" id="basic-addon2" style={props.buttonStyle.primary}>
            <Link to="/scanner">
              <i style={{color:"#FFFFFF"}} className="fas fa-qrcode" />
            </Link>
          </div>
        </div>
      }
  </div>
  )
}

export default AddressBar