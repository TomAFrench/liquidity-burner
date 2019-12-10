import React from 'react'

import i18n from '../i18n'

import NavCard from '../components/NavCard'
import Receive from '../components/Receive'

export default (props) => {
  return (
    <div>
      <div className='main-card card w-100' style={{ zIndex: 1 }}>

        <NavCard title={i18n.t('receive_title')} />
        <Receive
          ensLookup={props.ensLookup}
          buttonStyle={props.buttonStyle}
          address={props.address}
          changeAlert={props.changeAlert}
        />
      </div>
      {props.backButton}
    </div>
  )
}
