import React from 'react';
import { Events, Blockie, Scaler } from "dapparatus";
import Web3 from 'web3';
import Ruler from "./Ruler";
import axios from "axios"
import i18n from '../i18n';
import i18next from 'i18next';

import NavCard from './NavCard';
import Bottom from './Bottom';
import LiquiditySendByScan from './LiquiditySendByScan'
import LiquidityReceive from './LiquidityReceive'
import LiquiditySendToAddress from './LiquiditySendToAddress'
import LiquidityTransactions from './LiquidityTransactions'
import LiquidityBridge from './LiquidityBridge';
import LiquidityExchange from './LiquidityExchange'

import Balance from "./Balance";

import { NOCUSTManager } from 'nocust-client'

import ethImg from '../images/ethereum.png';
import daiImg from '../images/dai.jpg';

const { toWei, fromWei, toBN } = require('web3-utils');

let HUB_CONTRACT_ADDRESS
let HUB_API_URL
let RPC_URL 
let TEST_DAI_ADDRESS

HUB_CONTRACT_ADDRESS = process.env.REACT_APP_HUB_CONTRACT_ADDRESS
HUB_API_URL = process.env.REACT_APP_HUB_API_URL
RPC_URL = process.env.REACT_APP_RPC_URL
TEST_DAI_ADDRESS = process.env.REACT_APP_TEST_DAI_ADDRESS

function getDisplayValue(value, decimals=4) {
  const displayVal = fromWei(value.toString(), 'ether');
  if (displayVal.indexOf('.') >= 0){
    return displayVal.substr(0, displayVal.indexOf('.') + decimals + 1);
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

    this.state = {
      toAddress: (props.scannerState ? props.scannerState.toAddress : ""),
      nocustManager: nocustManager,
      address: limboweb3.eth.accounts.wallet[0].address,
      addressRegistered: false,
      blocksToWithdrawal: -1,
      limboweb3: limboweb3,
      view: "main"
    }


    this.checkRegistration().then((addressRegistered) => {
      this.setState({addressRegistered})
      if (!addressRegistered) {
        this.registerWithHub().then(() => {
          this.checkBalance()
        })
      }
    })
  }

  componentDidMount(){

    setInterval(this.pollInterval.bind(this),5000)
    setTimeout(this.pollInterval.bind(this),30)

    setInterval(this.longPollInterval.bind(this),8000)
    setTimeout(this.longPollInterval.bind(this),30)

  }

  async checkRegistration(){
    let addressRegistered = await this.state.nocustManager.isAddressRegistered(this.state.address)
    console.log("registration check", addressRegistered)
    this.setState({addressRegistered})
    return addressRegistered 
  }

  async registerWithHub(){
    console.log("just before registration")
    this.state.nocustManager.registerAddress(this.state.address)
    console.log("registered ETH")
    this.state.nocustManager.registerAddress(this.state.address, TEST_DAI_ADDRESS)
    console.log("Finished registering")
  }

  async pollInterval(){
    console.log("POLL")
    this.checkBalance()
  }

  async longPollInterval(){
    console.log("LONGPOLL")
    this.checkWithdrawalInfo()
  }

  async checkBalance(){
    const ethBalance = await this.state.nocustManager.getOnChainBalance(this.state.address)
    const fethBalance = await this.state.nocustManager.getNOCUSTBalance(this.state.address)

    const daiBalance = await this.state.nocustManager.getOnChainBalance(this.state.address, TEST_DAI_ADDRESS)
    const fdaiBalance = await this.state.nocustManager.getNOCUSTBalance(this.state.address, TEST_DAI_ADDRESS)
    
    this.setState({ethBalance, daiBalance, fethBalance, fdaiBalance})
    console.log({ethBalance, daiBalance, fethBalance, fdaiBalance})

    // NOCUST uses big-number.js rather than BN.js so need to convert
    const displayEth = getDisplayValue(toBN(ethBalance))
    const displayfEth = getDisplayValue(toBN(fethBalance))
    const displayDai = getDisplayValue(toBN(daiBalance))
    const displayfDai = getDisplayValue(toBN(fdaiBalance))
    this.setState({displayEth, displayfEth, displayDai, displayfDai})
    console.log({displayEth, displayfEth, displayDai, displayfDai})

    let transactions = await this.state.nocustManager.getTransactionsForAddress(this.state.address, TEST_DAI_ADDRESS)
    if (transactions.length) {
      transactions = transactions.reverse()
    }
    this.setState({transactions})
  }

  async checkWithdrawalInfo () {

    const gasPrice = toWei("10","gwei")
    const withdrawFee = await this.state.nocustManager.getWithdrawalFee(gasPrice)
    const ethWithdrawLimit = await this.state.nocustManager.getWithdrawalLimit(this.state.address, HUB_CONTRACT_ADDRESS)
    const daiWithdrawLimit = await this.state.nocustManager.getWithdrawalLimit(this.state.address, TEST_DAI_ADDRESS)
    const blocksToWithdrawal = await this.state.nocustManager.getBlocksToWithdrawalConfirmation(this.state.address, undefined, HUB_CONTRACT_ADDRESS)

    this.setState({withdrawFee, ethWithdrawLimit, daiWithdrawLimit, blocksToWithdrawal})
  }

  async confirmWithdrawal () {
    const gasPrice = toWei("1","gwei")
    const gasLimit = "300000"

    console.log(this.state.address, gasPrice, gasLimit)
    const txhash = await this.state.nocustManager.withdrawalConfirmation(this.state.address, gasPrice, gasLimit, HUB_CONTRACT_ADDRESS)
    console.log("withdrawal", txhash)
    this.checkBalance()
  }


  changeView (view) {
    this.setState({view}, console.log)
  }

  goBack () {
    this.changeView("main")
  }

  openScanner(returnState){
    this.setState({returnState:returnState,view:"send_by_scan"})
  }

  returnToState(scannerState){
    let updateState = Object.assign({scannerState:scannerState}, this.state.returnState);
    updateState.returnState = false
    console.log("UPDATE FROM RETURN STATE",updateState)
    this.setState(updateState)
  }

  render(){
    
    let sendButtons = (
      <div>
        {typeof this.state.blocksToWithdrawal !== 'undefined' && this.state.blocksToWithdrawal != -1 &&
        <div className="content ops row">
          <div className="col-12 p-1" onClick={() => this.confirmWithdrawal()}>
            <button className={`btn btn-large w-100 ${this.state.blocksToWithdrawal == 0 ? '' : 'disabled'}`} style={this.props.buttonStyle.primary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className={`fas ${this.state.blocksToWithdrawal == 0 ? 'fa-check' : 'fa-clock'}`}/> {this.state.blocksToWithdrawal == 0 ? i18next.t('liquidity.withdraw.confirm') : this.state.blocksToWithdrawal + " blocks until confirmation"}
              </Scaler>
            </button>
          </div>
        </div>}
        <div className="content ops row">
          <div className="col-6 p-1" onClick={() => this.changeView('receive')}>
            <button className="btn btn-large w-100" style={this.props.buttonStyle.primary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-qrcode"  /> {i18next.t('main_card.receive')}
              </Scaler>
            </button>
          </div>
          <div className="col-6 p-1">
            <button className="btn btn-large w-100" onClick={() => this.changeView('send_to_address')} style={this.props.buttonStyle.primary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-paper-plane"/> {i18next.t('main_card.send')}
              </Scaler>
            </button>
          </div>
        </div>
        <div className="content ops row">
          <div className="col-6 p-1" onClick={() => this.changeView('bridge')}>
            <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-hand-holding-usd"/> {i18next.t('liquidity.bridge.title')}
              </Scaler>
            </button>
          </div>
          <div className="col-6 p-1" onClick={() => this.changeView('tex')}>
            <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-hand-holding-usd"/> {i18next.t('exchange_title')}
              </Scaler>
            </button>
          </div>
        </div>
      </div>
    )

    switch(this.state.view){
      case 'main':
        return (
          <React.Fragment>
            <div className="send-to-address card w-100" style={{zIndex:1}}>
              <NavCard title={"Liquidity Network"} titleLink={""} goBack={this.props.goBack}/>
              <div className="form-group w-100">

                <div style={{width:"100%",textAlign:"center"}}>
                  {/* <Ruler/>
                  <div style={{padding:20}}>
                    The logged in user is
                    <Blockie
                      address={this.props.address}
                      config={{size:6}}
                    />
                    {this.props.address.substring(0,8)}
                    <div>
                      They {this.state.addressRegistered ? "are" : "aren't"} registered.
                    </div>
                  </div> */}

                  <Balance
                        icon={daiImg}
                        selected={true}
                        text="fDAI"
                        amount={this.state.displayfDai}
                        address={this.props.account}
                        dollarDisplay={(balance)=>{return balance}}
                      />
                  <Ruler/>
                  <Balance
                        icon={daiImg}
                        selected={true}
                        text="DAI"
                        amount={this.state.displayDai}
                        address={this.props.account}
                        dollarDisplay={(balance)=>{return balance}}
                      />
                  <Ruler/>
                  <Balance
                        icon={ethImg}
                        selected={true}
                        text="fETH"
                        amount={this.state.displayfEth}
                        address={this.props.account}
                        dollarDisplay={(balance)=>{return balance}}
                      />
                  <Ruler/>
                  <Balance
                        icon={ethImg}
                        selected={true}
                        text="ETH"
                        amount={this.state.displayEth}
                        address={this.props.account}
                        dollarDisplay={(balance)=>{return balance}}
                      />
                  <Ruler/>

                  {sendButtons}

                  {/* <Ruler/> */}

                  {/* <div>
                    Network {this.props.network} is selected and on block #{this.props.block}.
                  </div>
                  <div>
                    Gas price on {this.props.network} is {this.props.gwei} gwei.
                  </div>
                  <div>
                    mainnetweb3 is on block {typeof this.state.mainnetBlockNumber !== 'undefined' ? this.state.mainnetBlockNumber : "..."} and version {this.props.mainnetweb3.version}
                  </div>
                  <div>
                    limbo is on block {typeof this.state.limboBlockNumber !== 'undefined' ? this.state.limboBlockNumber : "..."} and version {this.state.limboweb3.version}
                  </div>
                  <div>
                    The current price of ETH is {this.props.dollarDisplay(this.props.ethprice)}.
                  </div>
                  <div>
                    Blocks until withdrawal confirmation: {this.state.blocksToWithdrawal}.
                  </div>
                  <div>
                    Account Registered?: {this.state.addressRegistered ? "Yes" : "No"}.
                  </div> */}

                  </div>
                  <LiquidityTransactions
                    dollarDisplay={(balance)=>{return balance}}
                    view={this.state.view}
                    buttonStyle={this.props.buttonStyle}
                    changeView={this.changeView.bind(this)}
                    address={this.state.account}
                    recentTxs={this.state.transactions}
                  />
                {/* <Events
                  config={{hide:false}}
                  eventName={"Sign"}
                  block={this.props.block}
                  onUpdate={(eventData,allEvents)=>{
                    console.log("EVENT DATA:",eventData)
                    this.setState({signEvents:allEvents})
                  }}
                /> */}

              </div>
          </div>
          <Bottom
            text={"Exit Liquidity Network"}
            action={this.props.goBack}
          />
        </React.Fragment>
        )
      case 'bridge':
        return (
          <div>
            <div className="main-card card w-100" style={{zIndex:1}}>
              <NavCard title={i18n.t('liquidity.bridge.title')} goBack={this.goBack.bind(this)}/>
              Withdrawal Fee: {typeof this.state.withdrawFee !== 'undefined' ? fromWei(this.state.withdrawFee.toString(), 'ether').toString() : 0} ETH
              <Ruler/>
              <LiquidityBridge
                text={"ETH"}
                image={ethImg}
                tokenAddress={HUB_CONTRACT_ADDRESS}
                address={this.state.address}
                buttonStyle={this.props.buttonStyle}
                nocust={this.state.nocustManager}
                ethBalance={this.state.ethBalance}
                onchainBalance={this.state.ethBalance}
                offchainBalance={this.state.fethBalance}
                onchainDisplay={this.state.displayEth}
                offchainDisplay={this.state.displayfEth}
                withdrawLimit={this.state.ethWithdrawLimit}
              />
              <Ruler/>
              <LiquidityBridge
                text={"DAI"}
                image={daiImg}
                tokenAddress={TEST_DAI_ADDRESS}
                address={this.state.address}
                buttonStyle={this.props.buttonStyle}
                nocust={this.state.nocustManager}
                ethBalance={this.state.ethBalance}
                onchainBalance={this.state.daiBalance}
                offchainBalance={this.state.fdaiBalance}
                onchainDisplay={this.state.displayDai}
                offchainDisplay={this.state.displayfDai}
                withdrawLimit={this.state.daiWithdrawLimit}
              />
            </div>
            <Bottom
              action={this.goBack.bind(this)}
            />
          </div>
        )
      case 'tex':
        return (
          <div>
            <div className="main-card card w-100" style={{zIndex:1}}>
              <NavCard title={i18n.t('exchange_title')} goBack={this.goBack.bind(this)}/>
              <LiquidityExchange
                assetAText={"fETH"}
                assetBText={"fDAI"}
                assetAAddress={HUB_CONTRACT_ADDRESS}
                assetBAddress={TEST_DAI_ADDRESS}
                assetAImage={ethImg}
                assetBImage={daiImg}
                assetABalance={this.state.fethBalance}
                assetBBalance={this.state.fdaiBalance}
                assetADisplay={this.state.displayfEth}
                assetBDisplay={this.state.displayfDai}
                address={this.state.address}
                buttonStyle={this.props.buttonStyle}
                nocust={this.state.nocustManager}
              />
            </div>
            <Bottom
              action={this.goBack.bind(this)}
            />
          </div>
        )
      case 'receive':
        return (
          <div>
            <div className="main-card card w-100" style={{zIndex:1}}>

              <NavCard title={i18n.t('receive_title')} goBack={this.goBack.bind(this)}/>
              {/* {defaultBalanceDisplay} */}
              <LiquidityReceive
                hubContract={HUB_CONTRACT_ADDRESS}
                hubApiUrl={HUB_API_URL}
                dollarDisplay={(balance)=>{return balance}}
                view={this.state.view}
                block={this.state.block}
                ensLookup={this.props.ensLookup}
                buttonStyle={this.props.buttonStyle}
                balance={this.props.balance}
                address={this.state.address}
                changeAlert={this.props.changeAlert}
              />
            </div>
            <Bottom
              action={this.goBack.bind(this)}
            />
          </div>
        )
      case 'send_to_address':
        return (
          <div>
            <div className="send-to-address card w-100" style={{zIndex:1}}>
            
              <NavCard title={i18n.t('send_to_address_title')} goBack={this.goBack.bind(this)}/>
              <Balance
                icon={daiImg}
                selected={true}
                text="fDAI"
                amount={this.state.displayfDai}
                address={this.props.account}
                dollarDisplay={(balance)=>{return balance}}
              />
              <Ruler/>
              <LiquiditySendToAddress
                nocustManager={this.state.nocustManager}
                convertToDollar={(dollar) => {return dollar}}
                dollarSymbol={"$"}
                parseAndCleanPath={this.props.parseAndCleanPath}
                openScanner={this.openScanner.bind(this)}
                scannerState={this.state.scannerState}
                ensLookup={this.props.ensLookup}
                buttonStyle={this.props.buttonStyle}
                offchainBalance={this.state.fdaiBalance}
                tokenAddress={TEST_DAI_ADDRESS}
                address={this.state.address}
                goBack={this.goBack.bind(this)}
                // changeView={this.props.changeView}
                setReceipt={this.props.setReceipt}
                changeAlert={this.props.changeAlert}
                dollarDisplay={(balance)=>{return balance}}
              />
            </div>
            <Bottom
              action={this.goBack.bind(this)}
            />
            {/* </div> */}

          </div>
        )
      case 'send_by_scan':
        return (
          <LiquiditySendByScan
          parseAndCleanPath={this.props.parseAndCleanPath}
          returnToState={this.returnToState.bind(this)}
          returnState={this.state.returnState}
          mainStyle={this.props.mainStyle}
          goBack={this.goBack.bind(this)}
          changeView={this.changeView.bind(this)}
          onError={(error) =>{
            this.props.changeAlert("danger",error)
          }}
          />
        );
    }

  }
}
