import React, { useState } from 'react'
import { Scaler } from 'dapparatus'
import Ruler from './Ruler'
import Balance from './Balance'
import AmountBar from './AmountBar'
import i18n from '../i18n'
import { useNocustClient } from '../contexts/Nocust'

import { useOrderbook } from '../contexts/Orderbook'
import { useTokens } from '../contexts/Tokens'
import { useOffchainAddressBalance } from '../contexts/Balances'

const { toWei, fromWei, toBN } = require('web3-utils')

const colStyle = {
  textAlign: 'center',
  whiteSpace: 'nowrap'
}

const rowStyle = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'nowrap',
  alignItems: 'center',
  justifyContent: 'space-between'
}

const flexColStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  justifyContent: 'space-evenly'
}

const TEXSwapper = (props) => {
  const [buyAmount, setBuyAmount] = useState('')
  const [sellAmount, setSellAmount] = useState('')

  const [maxInput, maxOutput] = getMaxOutputs(props.orders, props.assetBalance)

  const cancelButton = (
    <span style={{ padding: 10, whiteSpace: 'nowrap' }}>
      <a href='#' style={{ color: '#000000' }} onClick={() => props.cancelAction()}>
        <i className='fas fa-times' /> {i18n.t('cancel')}
      </a>
    </span>
  )

  const buyAmountBar = (
    <AmountBar
      buttonStyle={props.buttonStyle}
      unit={props.assetBuyText}
      value={buyAmount}
      updateValue={amount => {
        setBuyAmount(amount)
        if (amount && typeof props.orders !== 'undefined') {
          setSellAmount(fromWei(getAmountIn(props.orders, toWei(amount, 'ether')), 'ether'))
        }
      }}
      maxValue={fromWei(maxOutput.toString(), 'ether')}
      minValue='0'
    />
  )

  const sellAmountBar = (
    <AmountBar
      buttonStyle={props.buttonStyle}
      unit={props.assetSellText}
      value={sellAmount}
      updateValue={amount => {
        setSellAmount(amount)
        if (amount && typeof props.orders !== 'undefined') {
          setBuyAmount(fromWei(getAmountOut(props.orders, toWei(amount, 'ether')), 'ether'))
        }
      }}
      maxValue={fromWei(maxInput.toString(), 'ether')}
      minValue='0'
    />
  )

  return (
    <div className='content ops row' style={rowStyle}>

      <div className='col-1 p-1' style={colStyle}>
        <i className={`fas ${props.icon}`} />
      </div>
      <div className='col-6 p-1' style={flexColStyle}>
        <div style={{ flexGrow: 1 }}>
          {props.reversed ? buyAmountBar : sellAmountBar}
        </div>
        <div style={{ flexGrow: 1 }}>
          {props.reversed ? sellAmountBar : buyAmountBar}
        </div>
      </div>

      <div className='col-2 p-1' style={colStyle}>
        <Scaler config={{ startZoomAt: 650, origin: '0% 85%' }}>
          {cancelButton}
        </Scaler>
      </div>
      <div className='col-3 p-1'>
        <button
          className='btn btn-large w-100' disabled={props.buttonsDisabled} style={props.buttonStyle.primary} onClick={async () => {
            props.successAction(buyAmount, sellAmount)
          }}
        >
          <Scaler config={{ startZoomAt: 600, origin: '10% 50%' }}>
            <i className={`fas ${props.icon}`} /> Send
          </Scaler>
        </button>
      </div>
    </div>
  )
}

const TEXSwapBar = (props) => {
  const [swapMode, setSwapMode] = useState(false)

  const assetABalance = useOffchainAddressBalance(props.address, props.assetA ? props.assetA.tokenAddress : undefined)
  const assetBBalance = useOffchainAddressBalance(props.address, props.assetB ? props.assetB.tokenAddress : undefined)
  const ordersAToB = useOrderbook(props.assetA ? props.assetA.tokenAddress : undefined, props.assetB ? props.assetB.tokenAddress : undefined)
  const ordersBToA = useOrderbook(props.assetB ? props.assetB.tokenAddress : undefined, props.assetA ? props.assetA.tokenAddress : undefined)

  const invalidOrderbook = (ordersAToB === [] && ordersBToA === [])

  let display = i18n.t('loading')

  if (invalidOrderbook) {
    display = (
      <div style={{ textAlign: 'center', width: '100%', fontSize: 20, marginTop: 10 }}>
        <Scaler config={{ startZoomAt: 400, origin: '50% 50%', adjustedZoom: 1 }}>
          Error connecting to TEX
        </Scaler>
      </div>
    )
  } else if (swapMode === 'AtoB') {
    display = (
      <TEXSwapper
        icon='fa-arrow-down'
        buttonStyle={props.buttonStyle}
        orders={ordersAToB}
        assetSellText={'f' + props.assetA.shortName}
        assetBuyText={'f' + props.assetB.shortName}
        assetBalance={assetABalance}
        successAction={(buyAmount, sellAmount) => {
          console.log('Buying ', buyAmount, props.assetB.shortName, ' for ', sellAmount, props.assetA.shortName)
          props.AtoBTrade(toWei(buyAmount, 'ether'), toWei(sellAmount, 'ether'))
          setSwapMode(false)
        }}
        cancelAction={() => {
          setSwapMode(false)
        }}
      />
    )
  } else if (swapMode === 'BtoA') {
    display = (
      <TEXSwapper
        reversed
        icon='fa-arrow-up'
        buttonStyle={props.buttonStyle}
        orders={ordersBToA}
        assetSellText={'f' + props.assetB.shortName}
        assetBuyText={'f' + props.assetA.shortName}
        assetBalance={assetBBalance}
        successAction={(buyAmount, sellAmount) => {
          console.log('Buying ', buyAmount, props.assetA.shortName, ' for ', sellAmount, props.assetB.shortName)
          props.BtoATrade(toWei(buyAmount, 'ether'), toWei(sellAmount, 'ether'))
          setSwapMode(false)
        }}
        cancelAction={() => {
          setSwapMode(false)
        }}
      />
    )
  } else {
    display = (
      <div className='content ops row'>
        <div className='col-6 p-1'>
          <button
            className='btn btn-large w-100'
            style={props.buttonStyle.primary}
            onClick={() => {
              setSwapMode('BtoA')
            }}
          >
            <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
              <i className='fas fa-arrow-up' /> {typeof props.assetB !== 'undefined' ? 'f' + props.assetB.shortName : i18n.t('loading')} to {typeof props.assetA !== 'undefined' ? 'f' + props.assetA.shortName : i18n.t('loading')}
            </Scaler>
          </button>
        </div>

        <div className='col-6 p-1'>
          <button
            className='btn btn-large w-100'
            style={props.buttonStyle.primary}
            onClick={() => {
              setSwapMode('AtoB')
            }}
          >
            <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
              <i className='fas fa-arrow-down' /> {typeof props.assetA !== 'undefined' ? 'f' + props.assetA.shortName : i18n.t('loading')} to {typeof props.assetB !== 'undefined' ? 'f' + props.assetB.shortName : i18n.t('loading')}
            </Scaler>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='main-card card w-100'>
      {display}
    </div>
  )
}

const getMaxOutputs = (orders, amount) => {
  if (!orders.length) {
    return ['0', '0']
  }
  const amountRemaining = (typeof amount !== 'undefined' ? toBN(amount) : toBN('0'))
  const maxIn = toBN('0')
  const maxOut = toBN('0')
  for (var i = 0; i < orders.length; i++) {
    const order = orders[i]

    if (amountRemaining.gte(toBN(order.remaining_in))) {
      maxIn.iadd(toBN(order.remaining_in))
      maxOut.iadd(toBN(order.remaining_out))
    } else {
      maxIn.iadd(toBN(amountRemaining))
      maxOut.iadd((toBN(order.remaining_out).mul(amountRemaining)).div(toBN(order.remaining_in)))
    }

    amountRemaining.isub(toBN(order.remaining_in))
    if (amountRemaining.lte(toBN('0'))) {
      break
    }
  }
  return [maxIn, maxOut]
}

const getAmountIn = (orders, amountOut) => {
  return getOtherAmount(orders, amountOut, 'out')
}

const getAmountOut = (orders, amountIn) => {
  return getOtherAmount(orders, amountIn, 'in')
}

const getOtherAmount = (orders, amount, knownQuantity) => {
  let unknownQuantity
  if (knownQuantity === 'in') {
    knownQuantity = 'remaining_in'
    unknownQuantity = 'remaining_out'
  } else {
    knownQuantity = 'remaining_out'
    unknownQuantity = 'remaining_in'
  }

  const amountRemaining = toBN(amount)
  let orderIdx = 0
  const output = toBN('0')
  while (amountRemaining.gt(toBN('0'))) {
    try {
      const order = orders[orderIdx]
      if (amountRemaining.gte(toBN(order[knownQuantity]))) {
        output.iadd(toBN(order[unknownQuantity]))
      } else {
        output.iadd((toBN(order[unknownQuantity]).mul(amountRemaining)).div(toBN(order[knownQuantity])))
      }
      amountRemaining.isub(toBN(order[knownQuantity]))
      orderIdx += 1
    } catch (e) {
      throw new Error('Not enough liquidity on exchange')
    }
  }
  return output
}

// async function syncSwaps () {
//   console.log('Getting swaps for', this.props.address)
//   const swaps = await this.props.nocust.synchronizeSwapOrders(this.props.address, this.props.assetA.tokenAddress, this.props.assetB.tokenAddress)

//   console.log('AtoBSwaps response', swaps)
// }

export default (props) => {
  const nocust = useNocustClient()
  const tokens = useTokens()

  const assetA = tokens[props.assetA]
  const assetB = tokens[props.assetB]

  return (
    <div>
      <Balance
        token={assetA}
        address={props.address}
        offchain
        selected
      />
      <Ruler />
      <TEXSwapBar
        assetA={assetA}
        assetB={assetB}
        buttonStyle={props.buttonStyle}
        AtoBTrade={(buyAmount, sellAmount) => nocust.sendSwap(props.address, props.assetB.tokenAddress, props.assetA.tokenAddress, buyAmount, sellAmount)}
        BtoATrade={(buyAmount, sellAmount) => nocust.sendSwap(props.address, props.assetA.tokenAddress, props.assetB.tokenAddress, buyAmount, sellAmount)}
      />
      <Balance
        token={assetB}
        address={props.address}
        offchain
        selected
      />
      <Ruler />
    </div>
  )
}
