import React, { Component } from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from 'react-router-dom'
import { ContractLoader, Dapparatus, Gas } from 'dapparatus'
import Web3 from 'web3'
import { toChecksumAddress } from 'web3-utils'
import axios from 'axios'
import { I18nextProvider } from 'react-i18next'

import i18n from './i18n'
import './App.scss'
import Header from './components/Header'
import NavCard from './components/NavCard'
import Advanced from './pages/AdvancedPage'
import Footer from './components/Footer'
import Loader from './components/Loader'
import burnerlogo from './images/liquidity.png'
import BurnWallet from './pages/BurnWalletPage'
import Bottom from './components/Bottom'
import namehash from 'eth-ens-namehash'
import incogDetect from './services/incogDetect.js'
import core from './core'

import LiquidityNetwork from './components/LiquidityNetwork'
import SendByScan from './components/SendByScan'

import { ThemeContext } from './contexts/Theme'
import NocustContext from './contexts/Nocust'
import TokensContext from './contexts/Tokens'
import BalanceContext from './contexts/Balances'
import WithdrawalContext from './contexts/Withdrawal'
import TransactionContext from './contexts/Transactions'
import OrderbookContext from './contexts/Orderbook'

const MAINNET_CHAIN_ID = '1'

const WEB3_PROVIDER = process.env.REACT_APP_WEB3_PROVIDER
const LOADERIMAGE = burnerlogo

const innerStyle = {
  maxWidth: 740,
  margin: '0 auto',
  textAlign: 'left'
}

let intervalLong

class App extends Component {
  static contextType = ThemeContext
  constructor (props) {
    super(props)
    this.state = {
      web3: false,
      account: false,
      gwei: 1.1,
      alert: null,
      ethprice: 0.00
    }
    this.alertTimeout = null
  }

  updateDimensions () {
    // force it to rerender when the window is resized to make sure qr fits etc
    this.forceUpdate()
  }

  saveKey (update) {
    this.setState(update)
  }

  detectContext () {
    console.log('DETECTING CONTEXT....')
    const [{ update }] = this.context
    // snagged from https://stackoverflow.com/questions/52759238/private-incognito-mode-detection-for-ios-12-safari
    incogDetect(async (result) => {
      if (result) {
        console.log('INCOG')
        update('INCOGNITO')
      } else if (typeof web3 !== 'undefined') {
        try {
          if (window.web3 && window.web3.currentProvider && window.web3.currentProvider.isMetaMask === true && window.web3.eth && typeof window.web3.eth.getAccounts === 'function' && isArrayAndHasEntries(await window.web3.eth.getAccounts())) {
            update('METAMASK')
          } else if (this.state.account && !this.state.metaAccount) {
            update('WEB3')
          }
        } catch (e) {
          console.log('CONTEXT ERROR', e)
        }
      }
    })
  }

  componentDidMount () {
    this.detectContext()

    window.addEventListener('resize', this.updateDimensions.bind(this))

    intervalLong = setInterval(this.longPoll.bind(this), 45000)
    setTimeout(this.longPoll.bind(this), 150)

    this.connectToENS()
  }

  componentWillUnmount () {
    clearInterval(intervalLong)
    window.removeEventListener('resize', this.updateDimensions.bind(this))
  }

  longPoll () {
    axios.get('https://api.coinmarketcap.com/v2/ticker/1027/')
      .then((response) => {
        try {
          const ethprice = response.data.data.quotes.USD.price
          this.setState({ ethprice })
        } catch (e) {
          console.error(e)
        }
      })
  }

  setPossibleNewPrivateKey (value) {
    this.setState({ possibleNewPrivateKey: value }, () => {
      this.dealWithPossibleNewPrivateKey()
    })
  }

  async dealWithPossibleNewPrivateKey () {
    // this happens as page load and you need to wait until
    if (this.state) {
      if (this.state.metaAccount && this.state.metaAccount.privateKey.replace('0x', '') === this.state.possibleNewPrivateKey.replace('0x', '')) {
        this.setState({ possibleNewPrivateKey: false })
        this.changeAlert({
          type: 'warning',
          message: 'Imported identical private key.'
        })
      } else {
        console.log('Checking on pk import...')
        console.log('this.state.metaAccount', this.state.metaAccount)

        this.setState({
          possibleNewPrivateKey: false,
          newPrivateKey: this.state.possibleNewPrivateKey
        })
      }
    } else {
      setTimeout(this.dealWithPossibleNewPrivateKey.bind(this), 500)
    }
  }

  componentDidUpdate (prevProps, prevState) {
    const { network, web3 } = this.state
    if (web3 && network !== prevState.network /* && !this.checkNetwork() */) {
      console.log('WEB3 DETECTED BUT NOT RIGHT NETWORK', web3, network, prevState.network)
      // this.changeAlert({
      //  type: 'danger',
      //  message: 'Wrong Network. Please use Custom RPC endpoint: https://dai.poa.network or turn off MetaMask.'
      // }, false)
    }
  };

  checkNetwork () {
    const { network } = this.state
    return network === 'Rinkeby' || network === 'Unknown'
  }

  connectToENS () {
    const { Contract } = core.getWeb3(MAINNET_CHAIN_ID).eth
    const ensContract = new Contract(require('./contracts/ENS.abi.js'), require('./contracts/ENS.address.js'))
    this.setState({ ensContract })
  }

  async ensLookup (name) {
    const hash = namehash.hash(name)
    console.log('namehash', name, hash)

    const resolver = await this.state.ensContract.methods.resolver(hash).call()
    if (resolver === '0x0000000000000000000000000000000000000000') return '0x0000000000000000000000000000000000000000'
    console.log('resolver address', resolver)

    const { Contract } = core.getWeb3(MAINNET_CHAIN_ID).eth
    const ensResolver = new Contract(require('./contracts/ENSResolver.abi.js'), resolver)
    console.log('ensResolver:', ensResolver)

    return ensResolver.methods.addr(hash).call()
  }

  changeAlert = (alert, hide = true) => {
    clearTimeout(this.alertTimeout)
    this.setState({ alert })
    if (alert && hide) {
      this.alertTimeout = setTimeout(() => {
        this.setState({ alert: null })
      }, 2000)
    }
  };

  render () {
    const [state] = this.context
    const { backgroundStyle, currentBackground } = state
    const { web3, account, metaAccount, burnMetaAccount, alert } = this.state

    if (document.getElementById('main')) {
      document.getElementById('main').style.backgroundImage = backgroundStyle[currentBackground].image
      document.body.style.backgroundColor = backgroundStyle[currentBackground].color
    }

    let web3Setup = ''
    if (web3) {
      web3Setup = (
        <ContractLoader
          key='ContractLoader'
          config={{ DEBUG: true }}
          web3={web3}
          require={path => {
            return require(`${__dirname}/${path}`)
          }}
          onReady={(contracts, customLoader) => {
            console.log('contracts loaded', contracts)
            this.setState({ contracts: contracts, customLoader: customLoader }, async () => {
              console.log('Contracts Are Ready:', contracts)
            })
            this.detectContext()
          }}
        />
      )
    }

    let header = (
      <div style={{ height: 50 }} />
    )

    if (web3) {
      header = (
        <div>
          <Header
            network={this.state.network}
            ens={this.state.ens}
            title={this.state.title}
            address={this.state.account}
          />
        </div>
      )
    }

    return (
      <Router>
        <I18nextProvider i18n={i18n}>
          <div id='main' style={this.context.mainStyle}>
            <div style={innerStyle}>
              {web3Setup}
              <div>
                {header}

                {web3 &&
                  <NocustContext web3={this.state.web3}>
                    <TokensContext>
                      <BalanceContext>
                        <WithdrawalContext>
                          <TransactionContext>
                            <OrderbookContext>
                              <Switch>
                                <Route
                                  path='/advanced'
                                  render={({ history }) => (
                                    <div>
                                      <div className='main-card card w-100' style={{ zIndex: 1 }}>
                                        <NavCard title={i18n.t('advance_title')} />
                                        <Advanced
                                          address={account}
                                          history={history}
                                          privateKey={metaAccount.privateKey}
                                          changeAlert={this.changeAlert}
                                          setPossibleNewPrivateKey={this.setPossibleNewPrivateKey.bind(this)}
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
                                        <BurnWallet
                                          address={account}
                                          goBack={history.goBack}
                                          burnWallet={() => {
                                            burnMetaAccount()
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
                                        web3={this.state.web3}
                                        privateKey={metaAccount.privateKey}

                                        address={toChecksumAddress(account)}

                                        network={this.state.network}

                                        ensLookup={this.ensLookup.bind(this)}

                                        ethprice={this.state.ethprice}

                                        setGwei={this.setGwei}
                                        gwei={this.state.gwei}

                                        changeAlert={this.changeAlert}
                                      />
                                    )
                                  }}
                                />
                              </Switch>
                            </OrderbookContext>
                          </TransactionContext>
                        </WithdrawalContext>
                      </BalanceContext>
                    </TokensContext>
                  </NocustContext>}

                {!web3 &&
                  <div>
                    <Loader loaderImage={LOADERIMAGE} />
                  </div>}

                {alert && <Footer alert={alert} changeAlert={this.changeAlert} />}
              </div>

              <Dapparatus
                config={{
                  DEBUG: false,
                  hide: true,
                  requiredNetwork: ['Unknown', 'Rinkeby'],
                  metatxAccountGenerator: false,
                  POLLINTERVAL: 5000 // responsible for slow load times
                }}
                // used to pass a private key into Dapparatus
                newPrivateKey={this.state.newPrivateKey}
                fallbackWeb3Provider={WEB3_PROVIDER}
                onUpdate={async (state) => {
                  console.log('Dapparatus update', state)

                  if (state.web3Provider) {
                    state.web3 = new Web3(state.web3Provider)
                    if (state.metaAccount) {
                      state.web3.eth.accounts.wallet.add(state.metaAccount.privateKey)
                    }

                    this.setState(state, () => {
                      // console.log("state set:",this.state)
                      if (this.state.possibleNewPrivateKey) {
                        this.dealWithPossibleNewPrivateKey()
                      }
                    })
                  }
                }}
              />
              <Gas
                network={this.state.network}
                onUpdate={(state) => {
                  console.log('Gas price update:', state)
                  this.setState({ gwei: (state.gwei + 0.001).toFixed(5) })
                }}
              />

              <div id='context' style={{ position: 'absolute', right: 5, top: -15, opacity: 0.2, zIndex: 100, fontSize: 60, color: '#FFFFFF' }}>
                {currentBackground !== 'DEFAULT' && currentBackground}
              </div>

            </div>
          </div>
        </I18nextProvider>
      </Router>
    )
  }
}

function isArrayAndHasEntries (array) {
  if (array === undefined || array.length === 0) {
    // array empty or does not exist
    return false
  }
  return true
}

export default App
