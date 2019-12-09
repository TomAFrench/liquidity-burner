import React from 'react'
import {
  Switch,
  Route,
  Link,
  Redirect
} from 'react-router-dom'
// import cookie from 'react-cookies'

import { Scaler } from 'dapparatus'
import Ruler from './Ruler'
import i18n from '../i18n'
import i18next from 'i18next'

import NavCard from './NavCard'
import Bottom from './Bottom'
import Loader from './Loader'

import Receive from './Receive'
import Request from './Request'
import SendToAddress from './SendToAddress'
import Transactions from './Transactions'
import Bridge from './Bridge'
import Exchange from './Exchange'

import Balance from './Balance'

import { isValidToken, lookupTokenAddress, useNocustClient, useTokens } from '../contexts/Nocust'

import lqdImg from '../images/liquidity.png'
import { useAllTokenBalances, useAddressBalance } from '../contexts/Balances'
import { useTokenTransactions } from '../contexts/Transactions'

const { toWei, fromWei } = require('web3-utils')
const qs = require('query-string')

const LOADERIMAGE = lqdImg

const HUB_CONTRACT_ADDRESS = process.env.REACT_APP_HUB_CONTRACT_ADDRESS
const HUB_API_URL = process.env.REACT_APP_HUB_API_URL
const TOKEN = process.env.REACT_APP_TOKEN

console.log('TOKEN', TOKEN)

async function checkWithdrawalInfo (nocust, address, tokens, gwei) {
  const withdrawFee = await nocust.getWithdrawalFee(toWei(gwei.toString(), 'gwei'))
  const ethBlocksToWithdrawal = await nocust.getBlocksToWithdrawalConfirmation(address, undefined, tokens.ETH.tokenAddress)
  const tokenBlocksToWithdrawal = await nocust.getBlocksToWithdrawalConfirmation(address, undefined, tokens[TOKEN].tokenAddress)

  let tokenAddress
  let blocksToWithdrawal
  if (ethBlocksToWithdrawal === -1) {
    tokenAddress = tokens[TOKEN].tokenAddress
    blocksToWithdrawal = tokenBlocksToWithdrawal
  } else if (tokenBlocksToWithdrawal === -1) {
    tokenAddress = tokens[TOKEN].tokenAddress
    blocksToWithdrawal = ethBlocksToWithdrawal
  } else {
    tokenAddress = (ethBlocksToWithdrawal < tokenBlocksToWithdrawal ? tokens.ETH.tokenAddress : tokens[TOKEN].tokenAddress)
    blocksToWithdrawal = Math.min(ethBlocksToWithdrawal, tokenBlocksToWithdrawal)
  }

  return { withdrawInfo: { tokenAddress, blocksToWithdrawal, withdrawFee } }
}

async function confirmWithdrawal (nocust, address, gwei, token) {
  const gasLimit = '300000'

  const txhash = await nocust.withdrawalConfirmation(address, toWei(gwei.toString(), 'gwei'), gasLimit, token)
  console.log('withdrawal', txhash)
}

export default (props) => {
  const nocust = useNocustClient(props.address)
  const tokens = useTokens()
  const balances = useAllTokenBalances(props.address)
  const transactions = useTokenTransactions(props.address, tokens[TOKEN].tokenAddress)

  useAddressBalance(props.address, tokens.ETH ? tokens.ETH.tokenAddress : undefined)
  useAddressBalance(props.address, tokens.LQD ? tokens.LQD.tokenAddress : undefined)

  if (!nocust || !tokens) return null

  const netId = 4
  const withdrawInfo = checkWithdrawalInfo(nocust, props.address, tokens, props.gwei)

  const sendButtons = (
    <div>
      {typeof withdrawInfo !== 'undefined' && typeof withdrawInfo.blocksToWithdrawal !== 'undefined' && withdrawInfo.blocksToWithdrawal !== -1 &&
        <div className='content ops row'>
          <div className='col-12 p-1' onClick={() => { if (withdrawInfo.blocksToWithdrawal === 0) confirmWithdrawal() }}>
            <button className={`btn btn-large w-100 ${withdrawInfo.blocksToWithdrawal === 0 ? '' : 'disabled'}`} style={props.buttonStyle.primary}>
              <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                <i className={`fas ${withdrawInfo.locksToWithdrawal === 0 ? 'fa-check' : 'fa-clock'}`} /> {withdrawInfo.blocksToWithdrawal === 0 ? i18next.t('liquidity.withdraw.confirm') : withdrawInfo.blocksToWithdrawal + ' blocks until confirmation'}
              </Scaler>
            </button>
          </div>
        </div>}
      <div className='content ops row'>
        <div className='col-12 p-1'>
          <button className='btn btn-large w-100' style={props.buttonStyle.primary}>
            <Link to={{ pathname: `${props.match.url}/send`, search: '?token=' + TOKEN }} style={{ textDecoration: 'none', color: props.buttonStyle.primary.color }}>
              <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                <i className='fas fa-paper-plane' /> {i18next.t('main_card.send')}
              </Scaler>
            </Link>
          </button>
        </div>
      </div>
      <div className='content ops row'>
        <div className='col-6 p-1'>
          <button className='btn btn-large w-100' style={props.buttonStyle.primary}>
            <Link to={`${props.match.url}/receive`} style={{ textDecoration: 'none', color: props.buttonStyle.primary.color }}>
              <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                <i className='fas fa-qrcode' /> {i18next.t('main_card.receive')}
              </Scaler>
            </Link>
          </button>
        </div>
        <div className='col-6 p-1'>
          <button className='btn btn-large w-100' style={props.buttonStyle.primary}>
            <Link to={`${props.match.url}/request/${TOKEN}`} style={{ textDecoration: 'none', color: props.buttonStyle.primary.color }}>
              <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                <i className='fas fa-money-bill-alt' /> {i18next.t('more_buttons.request')}
              </Scaler>
            </Link>
          </button>
        </div>
      </div>
      <div className='content ops row'>
        <div className='col-6 p-1'>
          <button className='btn btn-large w-100' style={props.buttonStyle.secondary}>
            <Link to={`${props.match.url}/bridge`} style={{ textDecoration: 'none', color: props.buttonStyle.secondary.color }}>
              <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                <i className='fas fa-hand-holding-usd' /> {i18next.t('bridge.title')}
              </Scaler>
            </Link>
          </button>
        </div>
        <div className='col-6 p-1'>
          <button className='btn btn-large w-100' style={props.buttonStyle.secondary}>
            <Link to={`${props.match.url}/exchange/ETH/${TOKEN}`} style={{ textDecoration: 'none', color: props.buttonStyle.secondary.color }}>
              <Scaler config={{ startZoomAt: 400, origin: '50% 50%' }}>
                <i className='fas fa-random' /> {i18next.t('exchange_title')}
              </Scaler>
            </Link>
          </button>
        </div>
      </div>
    </div>
  )
  const backButton = (
    <Link to={props.match.url}>
      <Bottom
        action={() => {}}
      />
    </Link>
  )

  return (
    <Switch>
      <Route path={`${props.match.url}/receive`}>
        <div>
          <div className='main-card card w-100' style={{ zIndex: 1 }}>

            <NavCard title={i18n.t('receive_title')} />
            <Receive
              hubContract={HUB_CONTRACT_ADDRESS}
              hubApiUrl={HUB_API_URL}
              ensLookup={props.ensLookup}
              buttonStyle={props.buttonStyle}
              address={props.address}
              changeAlert={props.changeAlert}
            />
          </div>
          {backButton}
        </div>
      </Route>

      <Route
        path={`${props.match.url}/sending`}
        render={({ history, location }) => (
          <div>
            <div style={{ zIndex: 1, position: 'relative', color: '#dddddd' }}>
              <NavCard title={(location.state && location.state.title) || 'Sending...'} darkMode />
            </div>
            <Loader
              loaderImage={LOADERIMAGE}
              mainStyle={props.mainStyle}
              onFinish={() => { history.replace('/') }}
            />
            {location.state && location.state.subtitle &&
              <div className='row' style={{ zIndex: 1, position: 'relative', color: '#dddddd' }}>
                <div style={{ textAlign: 'center', width: '100%', fontSize: 16, marginTop: 10 }}>
                  <Scaler config={{ startZoomAt: 400, origin: '50% 50%', adjustedZoom: 1 }}>
                    {location.state.subtitle}
                  </Scaler>
                </div>
              </div>}
          </div>
        )}
      />

      <Route
        path={`${props.match.url}/send/:toAddress`}
        render={({ location, match }) => (
          <Redirect to={{ pathname: `${props.match.url}/send`, search: location.search, state: { toAddress: match.params.toAddress } }} />
        )}
      />

      <Route
        path={`${props.match.url}/send`}
        render={({ history, location }) => {
          const query = qs.parse(location.search)

          // First look up token shortname.
          // May have been given the token's address so perform lookup if that fails
          // Finally default to main token.
          const token = tokens[query.token] || lookupTokenAddress(query.token) || tokens[TOKEN]
          const tokenBalance = typeof token !== 'undefined' ? balances[token.tokenAddress] : undefined
          const tokenAmount = typeof query.amount === 'string' ? fromWei(query.amount, 'ether') : undefined
          return (
            <div>
              <div className='send-to-address card w-100' style={{ zIndex: 1 }}>

                <NavCard title={i18n.t('send_to_address_title')} />
                <Balance
                  token={token}
                  balance={tokenBalance}
                  offchain
                  selected
                  address={props.address}
                />
                <Ruler />
                <SendToAddress
                  token={token}
                  sendTransaction={(tx) => nocust.sendTransaction(tx)}
                  convertToDollar={(dollar) => { return dollar }}
                  toAddress={typeof location.state !== 'undefined' ? location.state.toAddress : undefined}
                  amount={tokenAmount}
                  ensLookup={props.ensLookup}
                  buttonStyle={props.buttonStyle}
                  offchainBalance={tokenBalance && tokenBalance.offchainBalance}
                  address={props.address}
                  changeAlert={props.changeAlert}
                  onSend={() => {
                    history.push(`${props.match.url}/sending`)
                  }}
                />
              </div>
              {backButton}
            </div>
          )
        }}
      />

      <Route
        path={`${props.match.url}/bridge`}
        render={() => {
          console.log(tokens)
          return (
            <div>
              <div className='main-card card w-100' style={{ zIndex: 1 }}>
                <NavCard title={i18n.t('bridge.title')} />
                <div style={{ textAlign: 'center', width: '100%', fontSize: 16, marginTop: 10 }}>
                  <Scaler config={{ startZoomAt: 400, origin: '50% 50%', adjustedZoom: 1 }}>
                    Withdrawal Fee: {typeof withdrawInfo.withdrawFee !== 'undefined' ? fromWei(withdrawInfo.withdrawFee.toString(), 'ether').toString() : 0} ETH
                  </Scaler>
                </div>
                <Ruler />
                <Bridge
                  address={props.address}
                  token={tokens.ETH}
                  balance={balances[tokens.ETH.tokenAddress]}
                  buttonStyle={props.buttonStyle}
                  nocust={nocust}
                  ethBalance={typeof balances[tokens.ETH.tokenAddress] !== 'undefined' ? balances[tokens.ETH.tokenAddress].onchainBalance : undefined}
                  gasPrice={toWei(props.gwei.toString(), 'gwei')}
                  withdrawLimit={typeof balances[tokens.ETH.tokenAddress] !== 'undefined' ? balances[tokens.ETH.tokenAddress].withdrawalLimit : undefined}
                  changeAlert={props.changeAlert}
                  onSend={() => {}}
                />
                <Ruler />
                <Bridge
                  address={props.address}
                  token={tokens[TOKEN]}
                  balance={balances[tokens[TOKEN].tokenAddress]}
                  buttonStyle={props.buttonStyle}
                  nocust={nocust}
                  ethBalance={typeof balances[tokens.ETH.tokenAddress] !== 'undefined' ? balances[tokens.ETH.tokenAddress].onchainBalance : undefined}
                  gasPrice={toWei(props.gwei.toString(), 'gwei')}
                  withdrawLimit={typeof balances[tokens[TOKEN].tokenAddress] !== 'undefined' ? balances[tokens[TOKEN].tokenAddress].withdrawalLimit : undefined}
                  changeAlert={props.changeAlert}
                  onSend={() => {}}
                />
              </div>
              {backButton}
            </div>
          )
        }}
      />

      <Route
        path={`${props.match.url}/exchange/:assetA/:assetB`}
        render={({ history, match }) => {
          // check if tokens are valid
          const assetA = match.params.assetA
          const assetB = match.params.assetB

          // redirect to main page if invalid
          if (!isValidToken(tokens, assetA) || !isValidToken(tokens, assetB)) {
            return (
              <Redirect to={props.match.url} />
            )
          }

          console.log('valid exchange pair', assetA, '-', assetB)
          return (
            <div>
              <div className='main-card card w-100' style={{ zIndex: 1 }}>
                <NavCard title={i18n.t('exchange_title')} />
                <Exchange
                  assetA={tokens[assetA]}
                  assetB={tokens[assetB]}
                  assetABalance={balances[assetA]}
                  assetBBalance={balances[assetB]}
                  address={props.address}
                  buttonStyle={props.buttonStyle}
                  nocust={nocust}
                />
              </div>
              {backButton}
            </div>
          )
        }}
      />

      <Route
        path={`${props.match.url}/request/:token`}
        render={({ history, match }) => {
          const token = match.params.token

          return (
            <div>
              <div className='main-card card w-100' style={{ zIndex: 1 }}>
                <NavCard title={i18n.t('request_funds')} />
                <Balance
                  token={tokens[token]}
                  balance={balances[token]}
                  offchain
                  selected
                  address={props.address}
                />
                <Ruler />
                <Request
                  mainStyle={props.mainStyle}
                  buttonStyle={props.buttonStyle}
                  token={tokens[token]}
                  address={props.address}
                  hubAddress={HUB_CONTRACT_ADDRESS}
                  networkId={netId}
                  changeAlert={props.changeAlert}
                />
              </div>
              {backButton}
            </div>
          )
        }}
      />

      <Route path={`${props.match.url}`}>
        <div>
          <div className='send-to-address card w-100' style={{ zIndex: 1 }}>
            <div className='form-group w-100'>

              <div style={{ width: '100%', textAlign: 'center' }}>
                <Link to={{ pathname: `${props.match.url}/send`, search: '?token=' + TOKEN }}>
                  <Balance
                    token={tokens[TOKEN]}
                    balance={balances[TOKEN]}
                    offchain
                    selected
                    address={props.address}
                  />
                </Link>
                <Ruler />
                <Balance
                  token={tokens[TOKEN]}
                  balance={balances[TOKEN]}
                  address={props.address}
                />
                <Ruler />
                <Link to={{ pathname: `${props.match.url}/send`, search: '?token=ETH' }}>
                  <Balance
                    token={tokens.ETH}
                    balance={balances.ETH}
                    offchain
                    selected
                    address={props.address}
                  />
                </Link>
                <Ruler />
                <Balance
                  token={tokens.ETH}
                  balance={balances.ETH}
                  address={props.address}
                />
                <Ruler />

                {sendButtons}

              </div>
              <Transactions
                changeAlert={props.changeAlert}
                address={props.address}
                token={tokens[TOKEN]}
                recentTxs={transactions}
              />
            </div>
          </div>
          <Link to='/advanced'>
            <Bottom
              icon='wrench'
              text={i18n.t('advance_title')}
              action={() => {}}
            />
          </Link>
        </div>
      </Route>
    </Switch>
  )
}
