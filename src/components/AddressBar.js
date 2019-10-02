import React from 'react';


const AddressBar = (props) => {

  return (
    <div className="input-group">
      <input type="text" className="form-control" placeholder="0x..." value={props.toAddress}
        ref={(input) => { if (typeof props.addressInput === 'function') { props.addressInput(input) }}}
            onChange={event => props.setToAddress(event.target.value)} />
      { typeof props.openScanner === 'function' &&
        <div className="input-group-append" onClick={() => {
          props.openScanner({view:"send_to_address"})
        }}>
          <span className="input-group-text" id="basic-addon2" style={props.buttonStyle.primary}>
            <i style={{color:"#FFFFFF"}} className="fas fa-qrcode" />
          </span>
        </div>
      }
  </div>
  )
}

export default AddressBar