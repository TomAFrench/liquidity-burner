import React, { useEffect, useMemo, useState } from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from 'react-router-dom'
import { Gas } from 'dapparatus'
import Web3 from 'web3'
import { toChecksumAddress } from 'web3-utils'
import { I18nextProvider } from 'react-i18next'

import i18n from './i18n'
import './App.scss'
import Header from './components/Header'
import NavCard from './components/NavCard'
import { AdvancedPage, BurnWalletPage } from './pages'
import Footer from './components/Footer'
import Loader from './components/Loader'
import burnerlogo from './images/liquidity.png'
import Bottom from './components/Bottom'
import namehash from 'eth-ens-namehash'
import incogDetect from './services/incogDetect.js'

import LiquidityNetwork from './components/LiquidityNetwork'
import SendByScan from './components/SendByScan'

import { useThemeContext } from './contexts/Theme'
import {
  NocustContext,
  TokensContext,
  BalanceContext,
  WithdrawalContext,
  TransactionContext,
  OrderbookContext
} from './contexts'

const LOADERIMAGE = burnerlogo

const innerStyle = {
  maxWidth: 740,
  margin: '0 auto',
  textAlign: 'left'
}

const ContextProviders = ({ web3, children }) => {
  return (
    <NocustContext web3={web3}>
      <TokensContext>
        <BalanceContext>
          <WithdrawalContext>
            <TransactionContext>
              <OrderbookContext>
                {children}
              </OrderbookContext>
            </TransactionContext>
          </WithdrawalContext>
        </BalanceContext>
      </TokensContext>
    </NocustContext>
  )
}

const Interface = (props) => {
  const [ensName, setEnsName] = useState('')
  useMemo(() => reverseEnsLookup(props.address).then(name => setEnsName(name)), [props.address])

  return (
    <>
      <div>
        <Header
          network={props.network}
          ens={ensName}
          address={props.address}
        />
      </div>
      <ContextProviders web3={props.web3}>
        <Switch>
          <Route
            path='/advanced'
            render={({ history }) => (
              <div>
                <div className='main-card card w-100' style={{ zIndex: 1 }}>
                  <NavCard title={i18n.t('advance_title')} />
                  <AdvancedPage
                    address={props.address}
                    history={history}
                    privateKey={props.privateKey}
                    changeAlert={props.changeAlert}
                    setPossibleNewPrivateKey={props.setPossibleNewPrivateKey}
                  />
                </div>
                <Link to='/'>
                  <Bottom
                    action={() => {}}
                  />
                </Link>
              </div>
            )}
          />

          <Route
            path='/scanner'
            render={({ history, location }) => (
              <SendByScan
                onError={(error) => {
                  this.changeAlert('danger', error)
                }}
                search={location.search}
                goBack={history.goBack}
              />
            )}
          />

          <Route
            path='/burn'
            render={({ history }) => (
              <div>
                <div className='main-card card w-100' style={{ zIndex: 1 }}>

                  <NavCard title='Burn Private Key' goBack={history.goBack} />
                  <BurnWalletPage
                    address={props.address}
                    goBack={history.goBack}
                    burnWallet={() => {
                      props.burnMetaAccount()
                      history.push('/')
                    }}
                  />
                </div>
                <Bottom
                  text={i18n.t('cancel')}
                  action={history.goBack}
                />
              </div>
            )}
          />

          <Redirect exact from='/' to='/liquidity' />
          <Route
            path='/liquidity'
            render={({ match }) => {
              return (
                <LiquidityNetwork
                  match={match}
                  web3={props.web3}
                  privateKey={props.privateKey}

                  address={toChecksumAddress(props.address)}

                  network={props.network}

                  ensLookup={ensLookup}

                  gwei={props.gwei}

                  changeAlert={props.changeAlert}
                />
              )
            }}
          />
        </Switch>
      </ContextProviders>
    </>
  )
}

async function ensLookup (name) {
  const hash = namehash.hash(name)
  console.log('namehash', name, hash)

  const { Contract } = new Web3(new Web3.providers.HttpProvider(process.env.REACT_APP_MAINNET_WEB3_PROVIDER)).eth

  const ensContract = new Contract(require('./contracts/ENS.abi.js'), require('./contracts/ENS.address.js'))
  const resolver = await ensContract.methods.resolver(hash).call()
  if (resolver === '0x0000000000000000000000000000000000000000') return '0x0000000000000000000000000000000000000000'
  console.log('resolver address', resolver)

  const ensResolver = new Contract(require('./contracts/ENSResolver.abi.js'), resolver)
  console.log('ensResolver:', ensResolver)

  return ensResolver.methods.addr(hash).call()
}

async function reverseEnsLookup (address) {
  const hash = namehash.hash(address.toLowerCase().substr(2) + '.addr.reverse')

  const { Contract } = new Web3(new Web3.providers.HttpProvider(process.env.REACT_APP_MAINNET_WEB3_PROVIDER)).eth

  const ensContract = new Contract(require('./contracts/ENS.abi.js'), require('./contracts/ENS.address.js'))
  const resolver = await ensContract.methods.resolver(hash).call()
  if (resolver === '0x0000000000000000000000000000000000000000') return null

  const ensResolver = new Contract(require('./contracts/ENSResolver.abi.js'), resolver)

  return ensResolver.methods.name(hash).call()
}

let alertTimeout

function detectContext (address, update) {
  console.log('DETECTING CONTEXT....')
  // snagged from https://stackoverflow.com/questions/52759238/private-incognito-mode-detection-for-ios-12-safari
  incogDetect(async (result) => {
    if (result) {
      console.log('INCOG')
      update('INCOGNITO')
    } else if (typeof web3 !== 'undefined') {
      try {
        if (window.web3 && window.web3.currentProvider && window.web3.currentProvider.isMetaMask === true && window.web3.eth && typeof window.web3.eth.getAccounts === 'function' && isArrayAndHasEntries(await window.web3.eth.getAccounts())) {
          update('METAMASK')
        } else if (address) { // && !this.state.metaAccount) {
          update('WEB3')
        }
      } catch (e) {
        console.log('CONTEXT ERROR', e)
      }
    }
  })
}

const App = (props) => {
  const [state, { update }] = useThemeContext()
  const { mainStyle, backgroundStyle, currentBackground } = state

  useEffect(() => {
    detectContext(address, update)
  }, [])

  // useEffect(() => {
  //   const { network, web3 } = props
  //   if (web3 && network !== prevProps.network) {
  //     console.log('WEB3 DETECTED BUT NOT RIGHT NETWORK', web3, network, prevProps.network)
  //   // this.changeAlert({
  //   //  type: 'danger',
  //   //  message: 'Wrong Network. Please use Custom RPC endpoint: https://dai.poa.network or turn off MetaMask.'
  //   // }, false)
  //   }
  // })

  const [alert, setAlert] = useState()

  const changeAlert = (alert, hide = true) => {
    clearTimeout(alertTimeout)
    setAlert(alert)
    if (alert && hide) {
      alertTimeout = setTimeout(() => {
        setAlert(null)
      }, 2000)
    }
  }

  const [gwei, setGwei] = useState()

  const { web3, network, address, burnMetaAccount, privateKey, setPossibleNewPrivateKey } = props

  if (document.getElementById('main')) {
    document.getElementById('main').style.backgroundImage = backgroundStyle[currentBackground].image
    document.body.style.backgroundColor = backgroundStyle[currentBackground].color
  }

  return (
    <Router>
      <I18nextProvider i18n={i18n}>
        <div id='main' style={mainStyle}>
          <div style={innerStyle}>
            <div>
              {web3 ? (
                <Interface
                  web3={web3}
                  address={address}
                  privateKey={privateKey}
                  burnMetaAccount={burnMetaAccount}
                  setPossibleNewPrivateKey={setPossibleNewPrivateKey}
                  network={network}
                  gwei={gwei}
                  changeAlert={changeAlert}
                />
              )
                : (
                  <div>
                    <Loader loaderImage={LOADERIMAGE} />
                  </div>
                )}

              {alert && <Footer alert={alert} changeAlert={changeAlert} />}
            </div>
            <div id='context' style={{ position: 'absolute', right: 5, top: -15, opacity: 0.2, zIndex: 100, fontSize: 60, color: '#FFFFFF' }}>
              {currentBackground !== 'DEFAULT' && currentBackground}
            </div>
          </div>
        </div>
        <Gas
          network={network}
          onUpdate={(state) => {
            console.log('Gas price update:', state)
            setGwei((state.gwei + 0.001).toFixed(5))
          }}
        />

      </I18nextProvider>
    </Router>
  )
}

function isArrayAndHasEntries (array) {
  if (array === undefined || array.length === 0) {
    // array empty or does not exist
    return false
  }
  return true
}

export default App
