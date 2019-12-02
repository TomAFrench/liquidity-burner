import React from 'react';
import {
  Switch,
  Route,
  Link,
  Redirect
} from "react-router-dom";
import cookie from 'react-cookies'

import { Scaler } from "dapparatus";
import Web3 from 'web3';
import Ruler from "./Ruler";
import i18n from '../i18n';
import i18next from 'i18next';

import NavCard from './NavCard';
import Bottom from './Bottom';
import Loader from './Loader';

import Receive from './Receive'
import SendToAddress from './SendToAddress'
import Transactions from './Transactions'
import Bridge from './Bridge';
import Exchange from './Exchange'

import Balance from "./Balance";

import { NOCUSTManager } from 'nocust-client'

import ethImg from '../images/ethereum.png';
import daiImg from '../images/dai.jpg';
import lqdImg from '../liquidity.png';
import burnerlogo from '../liquidity.png';
let LOADERIMAGE = burnerlogo


const { toWei, fromWei, toBN } = require('web3-utils');
const qs = require('query-string');


const HUB_CONTRACT_ADDRESS = process.env.REACT_APP_HUB_CONTRACT_ADDRESS
const HUB_API_URL = process.env.REACT_APP_HUB_API_URL
const RPC_URL = process.env.REACT_APP_WEB3_PROVIDER
const TOKEN = process.env.REACT_APP_TOKEN

console.log("TOKEN", TOKEN)

function getDisplayValue(value, decimals=4) {
  const displayVal = fromWei(value.toString(), 'ether');
  if (displayVal.indexOf('.') >= 0){
    if (displayVal.charAt(0) == "0") {
      return displayVal.substr(0, displayVal.search(/[1-9]/) + decimals + 1);
    }
    else {
      return displayVal.substr(0, displayVal.indexOf('.') + decimals + 1);
    }
  }
  return displayVal
}

export default class LiquidityNetwork extends React.Component {

  constructor(props) {
    super(props);

    let limboweb3 = new Web3(new Web3.providers.HttpProvider(RPC_URL))
    limboweb3.eth.accounts.wallet.add(props.privateKey)

    const nocustManager = new NOCUSTManager({
      rpcApi: limboweb3,
      operatorApiUrl: HUB_API_URL,
      contractAddress: HUB_CONTRACT_ADDRESS,
      });

    console.log(nocustManager)

    var tokens = cookie.load('availableTokens') 
    if (typeof tokens === 'undefined') {
      tokens = { "ETH": {}, "DAI": {}, "LQD": {} }
    }

    var balances = cookie.load('tokenBalances') 
    if (typeof balances === 'undefined') {
      balances = { "ETH": {}, "DAI": {}, "LQD": {} }
    }

    console.log("Initial balances:", balances)

    
    this.state = {
      nocustManager: nocustManager,
      address: limboweb3.eth.accounts.wallet[0].address,
      tokens: tokens,
      balances: balances,
      withdrawInfo: {}
    }

  }

  componentDidMount(){

    this.checkRegistration().then(async (addressRegistered) => {
      this.getAssets()
      if (!addressRegistered) {
        const registration = await this.registerWithHub()
        console.log("Completed registration")
      }
      this.checkTokenBalances()
      this.getTransactions()
    })

    this.state.nocustManager.subscribeToIncomingTransfer(
      this.state.address,
      tx => {
        console.log(`Incoming transaction from: ${tx.wallet.address} of: ${tx.amount.toString()} wei of token ${tx.wallet.token}.`)
        this.checkTokenBalances()
        this.getTransactions()
      }, 
      'all'
    ).then((unsubscribe) => this.setState({unsubscribe}))
    
    const longPollingIntervalId = setInterval(this.longPollInterval.bind(this),60000)
    this.setState({longPollingIntervalId})
  }
  
  componentWillUnmount(){
    if (typeof this.state.unsubscribe === 'function') {
      console.log("Unsubscribing from incoming transactions")
      this.state.unsubscribe()
    }

    console.log("No longer polling NOCUST")
    clearInterval(this.state.longPollingIntervalId)
  }

  async checkRegistration(){
    try {
      const addressRegistered = await this.state.nocustManager.isAddressRegistered(this.state.address, HUB_CONTRACT_ADDRESS)
      console.log(addressRegistered ? "Already registered" : "Address hasn't registered with the hub")
      return addressRegistered 
    } catch (e) {
      console.log("Error when checking registration:", e)
      return false
    }
  }

  async registerWithHub(){
    console.log("Registering with hub")
    if (this.state.tokens) {
      return Promise.all(Object.values(this.state.tokens).map(async (token) => this.registerToken(token.tokenAddress)))
    }
  }

  async registerToken(tokenAddress) {
    console.log("Registering token:", tokenAddress)
    try {
      return this.state.nocustManager.registerAddress(this.state.address, tokenAddress)
    } catch (e) {
      console.log("Error registering", e)
      return setTimeout(this.registerToken(tokenAddress), 1000)
    }
  }

  async getAssets(){
    console.log("Retrieving which tokens are supported by hub")
    const tokenList = await this.state.nocustManager.getSupportedTokens()
    const tokenDict = this.buildTokenDict(tokenList)
    
    this.setState({tokens: tokenDict})
    cookie.save('availableTokens', tokenDict, { path: '/' })
  }

  isValidToken(tokenShortName) {
    return Object.keys(this.state.tokens).includes(tokenShortName)
  }

  buildTokenDict(tokenList) {
    var tokens = tokenList.reduce((accumulator, pilot) => {
      return {...accumulator, [pilot.shortName]: {name: pilot.name, shortName: pilot.shortName, tokenAddress: pilot.tokenAddress}}
    }, {})

    tokens.ETH.image = ethImg
    if (tokens.DAI) tokens.DAI.image = daiImg
    if (tokens.LQD) tokens.LQD.image = lqdImg

    return tokens
  }

  async longPollInterval(){
    console.log("LONGPOLL")
    this.checkTokenBalances()
    this.checkWithdrawalInfo()
  }
  
  async checkTokenBalances(){
    console.log("Checking token balances...")
    if (this.state.tokens) {
      let newBalances = {}
      for (let [key, value] of Object.entries(JSON.parse(JSON.stringify(this.state.tokens)))) {
        newBalances[key] = await this.checkTokenBalance(value.tokenAddress)
      }
      console.log(newBalances)
      cookie.save('tokenBalances', newBalances, { path: '/' })
      this.setState({balances: newBalances})
    }
    return true
  }

  async checkTokenBalance (tokenAddress) {
    try {
      const onchainBalance = await this.state.nocustManager.getOnChainBalance(this.state.address, tokenAddress)
      const offchainBalance = await this.state.nocustManager.getNOCUSTBalance(this.state.address, tokenAddress)

      const displayOnchain = getDisplayValue(toBN(onchainBalance))
      const displayOffchain = getDisplayValue(toBN(offchainBalance))
  
      const withdrawalLimit = await this.state.nocustManager.getWithdrawalLimit(this.state.address, tokenAddress)
  
      return {onchainBalance, offchainBalance, displayOnchain, displayOffchain, withdrawalLimit}
    } catch (e) {
      return this.state.nocustManager.registerAddress(this.state.address, tokenAddress).then(() => {
        return this.checkTokenBalance(tokenAddress)
      })
      
    }
  }

  async getTransactions() {
    let transactions = await this.state.nocustManager.getTransactionsForAddress(this.state.address, this.state.tokens[TOKEN].tokenAddress)
    if (transactions.length) {
      transactions = transactions.reverse()
    }
    this.setState({transactions})
  }

  async checkWithdrawalInfo () {
    const withdrawFee = await this.state.nocustManager.getWithdrawalFee(toWei(this.props.gwei.toString(), "gwei"))
    const ethBlocksToWithdrawal = await this.state.nocustManager.getBlocksToWithdrawalConfirmation(this.state.address, undefined, this.state.tokens.ETH.tokenAddress)
    const tokenBlocksToWithdrawal = await this.state.nocustManager.getBlocksToWithdrawalConfirmation(this.state.address, undefined, this.state.tokens[TOKEN].tokenAddress)
    
    let tokenAddress
    let blocksToWithdrawal
    if (ethBlocksToWithdrawal === -1) {
      tokenAddress = this.state.tokens[TOKEN].tokenAddress
      blocksToWithdrawal = tokenBlocksToWithdrawal
    } else if (tokenBlocksToWithdrawal === -1) {
      tokenAddress = this.state.tokens[TOKEN].tokenAddress
      blocksToWithdrawal = ethBlocksToWithdrawal
    } else {
      tokenAddress = (ethBlocksToWithdrawal < tokenBlocksToWithdrawal ? this.state.tokens.ETH.tokenAddress : this.state.tokens[TOKEN].tokenAddress )
      blocksToWithdrawal = Math.min(ethBlocksToWithdrawal, tokenBlocksToWithdrawal)
    }

    this.setState({withdrawInfo: { tokenAddress, blocksToWithdrawal, withdrawFee }})
  }

  async confirmWithdrawal () {
    const gasLimit = "300000"

    const txhash = await this.state.nocustManager.withdrawalConfirmation(this.state.address, toWei(this.props.gwei.toString(), "gwei"), gasLimit, this.state.withdrawInfo.token)
    console.log("withdrawal", txhash)
  }

  render(){

    let sendButtons = (
      <div>
        {typeof this.state.withdrawInfo !== 'undefined' && typeof this.state.withdrawInfo.blocksToWithdrawal !== 'undefined' && this.state.withdrawInfo.blocksToWithdrawal != -1 &&
        <div className="content ops row">
          <div className="col-12 p-1" onClick={() => {if (this.state.withdrawInfo.blocksToWithdrawal == 0) this.confirmWithdrawal()}}>
            <button className={`btn btn-large w-100 ${this.state.withdrawInfo.blocksToWithdrawal == 0 ? '' : 'disabled'}`} style={this.props.buttonStyle.primary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className={`fas ${this.state.withdrawInfo.locksToWithdrawal == 0 ? 'fa-check' : 'fa-clock'}`}/> {this.state.withdrawInfo.blocksToWithdrawal == 0 ? i18next.t('liquidity.withdraw.confirm') : this.state.withdrawInfo.blocksToWithdrawal + " blocks until confirmation"}
              </Scaler>
            </button>
          </div>
        </div>}
        <div className="content ops row">
          <div className="col-6 p-1" >
            <button className="btn btn-large w-100" style={this.props.buttonStyle.primary}>
              <Link to={`${this.props.match.url}/receive`} style={{ textDecoration: 'none', color: this.props.buttonStyle.primary.color }}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-qrcode"  /> {i18next.t('main_card.receive')}
                </Scaler>
              </Link>
            </button>
          </div>
          <div className="col-6 p-1">
            <button className="btn btn-large w-100" style={this.props.buttonStyle.primary}>
              <Link to={{pathname:`${this.props.match.url}/send`, search: "?token="+TOKEN}} style={{ textDecoration: 'none', color: this.props.buttonStyle.primary.color }}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-paper-plane"/> {i18next.t('main_card.send')}
                </Scaler>
              </Link>
            </button>
          </div>
        </div>
        <div className="content ops row">
          <div className="col-6 p-1" >
            <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary}>
              <Link to={`${this.props.match.url}/bridge`} style={{ textDecoration: 'none', color: this.props.buttonStyle.secondary.color }}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-hand-holding-usd"/> {i18next.t('liquidity.bridge.title')}
                </Scaler>
              </Link>
            </button>
          </div>
          <div className="col-6 p-1" >
            <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary}>
              <Link to={`${this.props.match.url}/exchange/ETH/${TOKEN}`} style={{ textDecoration: 'none', color: this.props.buttonStyle.secondary.color }}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-random"/> {i18next.t('exchange_title')}
                </Scaler>
              </Link>
            </button>
          </div>
        </div>
      </div>
    )
    const backButton = (
      <Link to={this.props.match.url}>
        <Bottom
          action={()=>{}}
        />
      </Link>
    )

    return (
      <Switch>
        <Route path={`${this.props.match.url}/receive`}>
          <div>
              <div className="main-card card w-100" style={{zIndex:1}}>

                <NavCard title={i18n.t('receive_title')}/>
                <Receive
                  hubContract={HUB_CONTRACT_ADDRESS}
                  hubApiUrl={HUB_API_URL}
                  ensLookup={this.props.ensLookup}
                  buttonStyle={this.props.buttonStyle}
                  address={this.state.address}
                  changeAlert={this.props.changeAlert}
                />
              </div>
              {backButton}
            </div>
        </Route>

        <Route
          path={`${this.props.match.url}/sending`}
          render={({history, location}) => (
            <div>
              <div style={{zIndex:1,position:"relative",color:"#dddddd"}}>
                <NavCard title={(location.state && location.state.title) || "Sending..."} darkMode/>
              </div>
              <Loader
                loaderImage={LOADERIMAGE}
                mainStyle={this.props.mainStyle}
                onFinish={() => { history.replace("/") }}
              />
              {location.state && location.state.subtitle &&
                <div className="row" style={{zIndex:1,position:"relative",color:"#dddddd"}}>
                  <div style={{textAlign:"center",width:"100%",fontSize:16,marginTop:10}}>
                    <Scaler config={{startZoomAt:400,origin:"50% 50%",adjustedZoom:1}}>
                      {location.state.subtitle}
                    </Scaler>
                  </div>
              </div>
              }
            </div>
          )}
        />

        <Route
          path={`${this.props.match.url}/send/:toAddress`}
          render={({ location, match }) => (
            <Redirect to={{ pathname: `${this.props.match.url}/send`, search: location.search, state: { toAddress: match.params.toAddress } }} />
            )}
        />

        <Route
          path={`${this.props.match.url}/send`}
          render={({ history, location }) => {
            const token = this.state.tokens[qs.parse(location.search).token] || this.state.tokens[TOKEN]
            const tokenBalance = this.state.balances[qs.parse(location.search).token] || this.state.tokens[TOKEN]
            const tokenAmount = qs.parse(location.search).amount
            return (
            <div>
              <div className="send-to-address card w-100" style={{zIndex:1}}>
              
                <NavCard title={i18n.t('send_to_address_title')} />
                <Balance
                  token={token}
                  balance={tokenBalance}
                  offchain
                  selected
                  address={this.props.account}
                  dollarDisplay={(balance)=>{return balance}}
                />
                <Ruler/>
                <SendToAddress
                  token={token}
                  sendTransaction={(tx) => this.state.nocustManager.sendTransaction(tx)}
                  convertToDollar={(dollar) => {return dollar}}
                  toAddress={typeof location.state !== 'undefined' ? location.state.toAddress : undefined}
                  amount={tokenAmount}
                  ensLookup={this.props.ensLookup}
                  buttonStyle={this.props.buttonStyle}
                  offchainBalance={tokenBalance.offchainBalance}
                  address={this.state.address}
                  changeAlert={this.props.changeAlert}
                  dollarDisplay={(balance)=>{return balance}}
                  onSend={() => {
                    history.push(`${this.props.match.url}/sending`)
                    setTimeout(() => {
                      this.checkTokenBalances()
                      this.getTransactions()
                    }, 250)
                  }}
                />
              </div>
              {backButton}
            </div>
          )}}
        />


        <Route
          path={`${this.props.match.url}/bridge`}
          render={() => (
            <div>
              <div className="main-card card w-100" style={{zIndex:1}}>
                <NavCard title={i18n.t('liquidity.bridge.title')} />
                <div style={{textAlign:"center",width:"100%",fontSize:16,marginTop:10}}>
                    <Scaler config={{startZoomAt:400,origin:"50% 50%",adjustedZoom:1}}>
                    Withdrawal Fee: {typeof this.state.withdrawInfo.withdrawFee !== 'undefined' ? fromWei(this.state.withdrawInfo.withdrawFee.toString(), 'ether').toString() : 0} ETH
                    </Scaler>
                </div>
                <Ruler/>
                <Bridge
                  address={this.state.address}
                  token={this.state.tokens.ETH}
                  balance={this.state.balances.ETH}
                  buttonStyle={this.props.buttonStyle}
                  nocust={this.state.nocustManager}
                  ethBalance={this.state.balances.ETH.onchainBalance}
                  gasPrice={toWei(this.props.gwei.toString(), "gwei")}
                  withdrawLimit={this.state.balances.ETH.withdrawalLimit}
                  changeAlert={this.props.changeAlert}
                  onSend={() => {
                    setTimeout(() => {
                      this.checkTokenBalances()
                      this.getTransactions()
                    }, 1000)
                  }}
                />
                <Ruler/>
                <Bridge
                  address={this.state.address}
                  token={this.state.tokens[TOKEN]}
                  balance={this.state.balances[TOKEN]}
                  buttonStyle={this.props.buttonStyle}
                  nocust={this.state.nocustManager}
                  ethBalance={this.state.balances.ETH.onchainBalance}
                  gasPrice={toWei(this.props.gwei.toString(), "gwei")}
                  withdrawLimit={this.state.balances[TOKEN].withdrawalLimit}
                  changeAlert={this.props.changeAlert}
                  onSend={() => {
                    setTimeout(() => {
                      this.checkTokenBalances()
                      this.getTransactions()
                    }, 1000)
                  }}
                />
              </div>
              {backButton}
            </div>
          )}
        />

        <Route
          path={`${this.props.match.url}/exchange/:assetA/:assetB`}
          render={({ history, match }) => {
            // check if tokens are valid
            const assetA = match.params.assetA
            const assetB = match.params.assetB

            // redirect to main page if invalid
            if (!this.isValidToken(assetA) || !this.isValidToken(assetB) ){
              return (
                <Redirect to={this.props.match.url}/>
              )
              }

            console.log("valid exchange pair", assetA, "-", assetB)
            return (
              <div>
              <div className="main-card card w-100" style={{zIndex:1}}>
                <NavCard title={i18n.t('exchange_title')} />
                <Exchange
                  assetA={this.state.tokens[assetA]}
                  assetB={this.state.tokens[assetB]}
                  assetABalance={this.state.balances[assetA]}
                  assetBBalance={this.state.balances[assetB]}
                  address={this.state.address}
                  buttonStyle={this.props.buttonStyle}
                  nocust={this.state.nocustManager}
                />
              </div>
              {backButton}
            </div>
            )}
            }
          />

        <Route path={`${this.props.match.url}`}>
        <div>
            <div className="send-to-address card w-100" style={{zIndex:1}}>
              <div className="form-group w-100">

                <div style={{width:"100%",textAlign:"center"}}>
                  <Link to={{pathname: `${this.props.match.url}/send`, search: "?token="+TOKEN}} >
                    <Balance
                      token={this.state.tokens[TOKEN]}
                      balance={this.state.balances[TOKEN]}
                      offchain
                      selected
                      address={this.props.account}
                      dollarDisplay={(balance)=>{return balance}}
                  />
                  </Link>
                  <Ruler/>
                  <Balance
                    token={this.state.tokens[TOKEN]}
                    balance={this.state.balances[TOKEN]}
                    address={this.props.account}
                    dollarDisplay={(balance)=>{return balance}}
                  />
                  <Ruler/>
                  <Link to={{pathname: `${this.props.match.url}/send`, search: "?token=ETH"}}>
                    <Balance
                      token={this.state.tokens.ETH}
                      balance={this.state.balances.ETH}
                      offchain
                      selected
                      address={this.props.account}
                      dollarDisplay={(balance)=>{return balance}}
                        />
                  </Link>
                  <Ruler/>
                  <Balance
                    token={this.state.tokens.ETH}
                    balance={this.state.balances.ETH}
                    address={this.props.account}
                    dollarDisplay={(balance)=>{return balance}}
                  />
                  <Ruler/>

                  {sendButtons}

                  </div>
                  <Transactions
                    dollarDisplay={(balance)=>{return balance}}
                    changeAlert={this.props.changeAlert}
                    address={this.state.account}
                    token={this.state.tokens[TOKEN]}
                    recentTxs={this.state.transactions}
                  />
              </div>
          </div>
            <Link to="/advanced">
              <Bottom
                icon={"wrench"}
                text={i18n.t('advance_title')}
                action={()=>{}}
              />
            </Link>
          </div>
        </Route>
      </Switch>
    )
  }
}
