import React from 'react';
import { Events, Blockie, Scaler } from "dapparatus";
import Web3 from 'web3';
import Ruler from "./Ruler";
import axios from "axios"
import i18n from '../i18n';
import i18next from 'i18next';

import NavCard from './NavCard';
import Bottom from './Bottom';
import LiquidityReceive from './LiquidityReceive'
import LiquiditySendToAddress from './LiquiditySendToAddress'
import LiquidityDeposit from './LiquidityDeposit'

import Balance from "./Balance";

import { NOCUSTManager } from 'nocust-client'
import { BigNumber } from 'ethers/utils';

import ethImg from '../images/ethereum.png';
import daiImg from '../images/dai.jpg';
import LiquidityWithdraw from './LiquidityWithdraw';

const { toWei, fromWei } = require('web3-utils');

const HUB_CONTRACT_ADDRESS = '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7'
const HUB_API_URL = 'https://limbo.liquidity.network/'
const RPC_URL = 'https://limbo.liquidity.network/ethrpc'
const TEST_DAI_ADDRESS = '0xe982E462b094850F12AF94d21D470e21bE9D0E9C'

// const HUB_CONTRACT_ADDRESS = '0x66b26B6CeA8557D6d209B33A30D69C11B0993a3a'
// const HUB_API_URL = 'https://rinkeby.liquidity.network/'
// const RPC_URL = 'https://rinkeby.infura.io/v3/59f8bd04971b4c8ea113ee02372b0f96'
// const TEST_DAI_ADDRESS = "0xA9F86DD014C001Acd72d5b25831f94FaCfb48717"


// const HUB_CONTRACT_ADDRESS = '0x83aFD697144408C344ce2271Ce16F33A74b3d98b'
// const HUB_API_URL = 'https://public.liquidity.network/'

function getDisplayValue(value, decimals=2) {
  const displayVal = fromWei(value.toString(), 'ether');
  return displayVal.substr(0, displayVal.indexOf('.') + decimals + 1);
}

export default class LiquidityNetwork extends React.Component {

  constructor(props) {
    super(props);

    let limboweb3 = new Web3(new Web3.providers.HttpProvider(RPC_URL))
    limboweb3.eth.accounts.wallet.add(props.privateKey)
    console.log("privkey", props.privateKey)

    const nocustManager = new NOCUSTManager({
      rpcApi: limboweb3,
      operatorApiUrl: HUB_API_URL,
      contractAddress: HUB_CONTRACT_ADDRESS,
      });

    console.log("limbo Acc", limboweb3.eth.accounts.wallet[0].address)
    console.log("acc:", this.props.mainnetweb3.eth.getAccounts())
    console.log("prop acc:", props.address)
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

    nocustManager.syncWallet(this.state.address)

    this.registerWithHub().then(() => {
      this.checkBalance()
    })
  }

  componentDidMount(){

    setInterval(this.pollInterval.bind(this),5000)
    setTimeout(this.pollInterval.bind(this),30)

    setInterval(this.longPollInterval.bind(this),15000)
    setTimeout(this.longPollInterval.bind(this),30)

  }

  // async checkRegistration(){
  //   let addressRegistered = await this.state.nocustManager.isAddressRegistered(this.state.address)
  //   console.log("registration check", addressRegistered)
  //   this.setState({addressRegistered})
  //   return addressRegistered 
  // }

  async registerWithHub(){
    console.log("just before registration")
    await this.state.nocustManager.registerAddress(this.state.address)
    console.log("registered ETH")
    await this.state.nocustManager.registerAddress(this.state.address, TEST_DAI_ADDRESS)
    console.log("Finished registering")
  }

  async pollInterval(){
    console.log("POLL")
    if(this.state){
      
      const limboBlockNumber = await this.state.limboweb3.eth.getBlockNumber()
      const mainnetBlockNumber = await this.props.mainnetweb3.eth.getBlockNumber()
      this.setState({mainnetBlockNumber, limboBlockNumber})
    }
  }

  async longPollInterval(){
    console.log("LONGPOLL")
    this.checkBalance()
    this.checkWithdrawalInfo()
  }

  async checkBalance(){
    const ethBalance = await this.state.nocustManager.getOnChainBalance(this.state.address)
    const fethBalance = await this.state.nocustManager.getNOCUSTBalance(this.state.address)

    const daiBalance = await this.state.nocustManager.getOnChainBalance(this.state.address, TEST_DAI_ADDRESS)
    const fdaiBalance = await this.state.nocustManager.getNOCUSTBalance(this.state.address, TEST_DAI_ADDRESS)
    
    this.setState({ethBalance, daiBalance, fethBalance, fdaiBalance})
    console.log({ethBalance, daiBalance, fethBalance, fdaiBalance})

    const blocksToWithdrawal = await this.state.nocustManager.getBlocksToWithdrawalConfirmation(this.state.address, undefined, TEST_DAI_ADDRESS)
    this.setState({blocksToWithdrawal})

    // NOCUST uses big-number.js rather than BN.js so need to convert
    const displayEth = getDisplayValue(this.state.limboweb3.utils.toBN(ethBalance))
    const displayfEth = getDisplayValue(this.state.limboweb3.utils.toBN(fethBalance))
    const displayDai = getDisplayValue(this.state.limboweb3.utils.toBN(daiBalance))
    const displayfDai = getDisplayValue(this.state.limboweb3.utils.toBN(fdaiBalance))
    this.setState({displayEth, displayfEth, displayDai, displayfDai})
    console.log({displayEth, displayfEth, displayDai, displayfDai})

  }

  async checkWithdrawalInfo () {
    const gasPrice = toWei("10","gwei")
    const withdrawFee = await this.state.nocustManager.getWithdrawalFee(gasPrice)
    const withdrawLimit = await this.state.nocustManager.getWithdrawalLimit(this.state.address, TEST_DAI_ADDRESS)
    this.setState({withdrawFee, withdrawLimit})
  }

  async confirmWithdrawal () {
    const gasPrice = toWei("1","gwei")
    const gasLimit = "300000"

    console.log(this.state.address, gasPrice, gasLimit)
    const txhash = await this.state.nocustManager.withdrawalConfirmation(this.state.address, gasPrice, gasLimit, TEST_DAI_ADDRESS)
    console.log("withdrawal", txhash)
    this.checkBalance()
  }


  changeView (view) {
    this.setState({view}, console.log)
  }

  goBack () {
    this.changeView("main")
  }

  render(){
    
    let sendButtons = (
      <div>
        {typeof this.state.blocksToWithdrawal !== 'undefined' && this.state.blocksToWithdrawal != -1 &&
        <div className="content ops row">
          <div className="col-12 p-1" onClick={() => this.confirmWithdrawal()}>
            <button className={`btn btn-large w-100 ${this.state.blocksToWithdrawal == 0 ? '' : 'disabled'}`} style={this.props.buttonStyle.primary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-qrcode"  /> {this.state.blocksToWithdrawal == 0 ? i18next.t('liquidity.withdraw.confirm') : this.state.blocksToWithdrawal + " blocks until confirmation"}
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
          <div className="col-6 p-1" onClick={() => this.changeView('deposit')}>
            <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-hand-holding-usd"/> {i18next.t('liquidity.deposit.title')}
              </Scaler>
            </button>
          </div>
          <div className="col-6 p-1">
            <button className="btn btn-large w-100" onClick={() => this.changeView('withdraw')} style={this.props.buttonStyle.secondary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-hand-holding-usd"/> {i18next.t('liquidity.withdraw.title')}
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
                        dollarDisplay={this.props.dollarDisplay}
                      />
                  <Ruler/>
                  <Balance
                        icon={daiImg}
                        selected={true}
                        text="DAI"
                        amount={this.state.displayDai}
                        address={this.props.account}
                        dollarDisplay={this.props.dollarDisplay}
                      />
                  <Ruler/>
                  <Balance
                        icon={ethImg}
                        selected={true}
                        text="ETH"
                        amount={this.state.displayEth}
                        address={this.props.account}
                        dollarDisplay={this.props.dollarDisplay}
                      />
                  <Ruler/>

                  {sendButtons}

                  <Ruler/>

                  <div>
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
                    Withdrawal Limit {this.state.withdrawLimit && this.state.withdrawLimit.toString()}.
                  </div>
                  <div>
                    Withdrawal Fee {this.state.withdrawFee && this.state.withdrawFee.toString()}.
                  </div>

                  </div>

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
      case 'receive':
        return (
          <div>
            <div className="main-card card w-100" style={{zIndex:1}}>

              <NavCard title={i18n.t('receive_title')} goBack={this.goBack.bind(this)}/>
              {/* {defaultBalanceDisplay} */}
              <LiquidityReceive
                hubContract={HUB_CONTRACT_ADDRESS}
                hubApiUrl={HUB_API_URL}
                dollarDisplay={this.props.dollarDisplay}
                view={this.state.view}
                block={this.state.block}
                ensLookup={this.props.ensLookup}
                buttonStyle={this.props.buttonStyle}
                balance={this.props.balance}
                address={this.state.address}
                changeAlert={this.props.changeAlert}
                dollarDisplay={this.props.dollarDisplay}
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
                dollarDisplay={this.props.dollarDisplay}
              />
              <Ruler/>
              <LiquiditySendToAddress
                nocustManager={this.state.nocustManager}
                convertToDollar={(dollar) => {return dollar}}
                dollarSymbol={"$"}
                parseAndCleanPath={this.props.parseAndCleanPath}
                openScanner={this.props.openScanner}
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
                dollarDisplay={this.props.dollarDisplay}
              />
            </div>
            <Bottom
              action={this.goBack.bind(this)}
            />
            {/* </div> */}

          </div>
        )
      case 'deposit':
        return (
          <div>
            <div className="send-to-address card w-100" style={{zIndex:1}}>
            
              <NavCard title={i18n.t('liquidity.deposit.title')} goBack={this.goBack.bind(this)}/>
              <LiquidityDeposit
                icon={daiImg}
                text="Dai"
                nocustManager={this.state.nocustManager}
                tokenAddress={TEST_DAI_ADDRESS}
                convertToDollar={(dollar) => {return dollar}}
                dollarSymbol={"$"}
                ensLookup={this.props.ensLookup}
                buttonStyle={this.props.buttonStyle}
                ethBalance={this.state.ethBalance}
                balance={this.state.ethBalance}
                onchainDisplay={this.state.displayDai}
                offchainBalance={this.state.fethBalance}
                offchainDisplay={this.state.displayfDai}
                address={this.state.address}
                goBack={this.goBack.bind(this)}
                changeAlert={this.props.changeAlert}
                dollarDisplay={this.props.dollarDisplay}
              />
            </div>
            <Bottom
              action={this.goBack.bind(this)}
            />
          </div>
        )
        case 'withdraw':
        return (
          <div>
            <div className="send-to-address card w-100" style={{zIndex:1}}>
            
              <NavCard title={i18n.t('liquidity.withdraw.title')} goBack={this.goBack.bind(this)}/>
              {i18n.t('liquidity.withdraw.warning')}
              <Ruler/>
              <LiquidityWithdraw
                icon={daiImg}
                text="Dai"
                nocustManager={this.state.nocustManager}
                tokenAddress={TEST_DAI_ADDRESS}
                withdrawLimit={this.state.withdrawLimit}
                convertToDollar={(dollar) => {return dollar}}
                dollarSymbol={"$"}
                ensLookup={this.props.ensLookup}
                buttonStyle={this.props.buttonStyle}
                ethBalance={this.state.ethBalance}
                balance={this.state.daiBalance}
                onchainDisplay={this.state.displayDai}
                offchainBalance={this.state.fdaiBalance}
                offchainDisplay={this.state.displayfDai}
                address={this.state.address}
                goBack={this.goBack.bind(this)}
                changeAlert={this.props.changeAlert}
                dollarDisplay={this.props.dollarDisplay}
              />
            </div>
            <Bottom
              action={this.goBack.bind(this)}
            />
          </div>
        )
    }

  }
}
