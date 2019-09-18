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

const { fromWei } = require('web3-utils');

// const HUB_CONTRACT_ADDRESS = '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7'
// const HUB_API_URL = 'https://limbo.liquidity.network/'
// const LIMBO_RPC_URL = 'https://limbo.liquidity.network/ethrpc'

const HUB_CONTRACT_ADDRESS = '0x66b26B6CeA8557D6d209B33A30D69C11B0993a3a'
const HUB_API_URL = 'https://rinkeby.liquidity.network/'

// const HUB_CONTRACT_ADDRESS = '0x83aFD697144408C344ce2271Ce16F33A74b3d98b'
// const HUB_API_URL = 'https://public.liquidity.network/'

const TEST_DAI_ADDRESS = "0xA9F86DD014C001Acd72d5b25831f94FaCfb48717"
export default class YourModule extends React.Component {

  constructor(props) {
    super(props);

    let limboweb3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/v3/59f8bd04971b4c8ea113ee02372b0f96'))
    limboweb3.eth.accounts.wallet.add(props.privateKey)
    console.log("privkey", props.privateKey)

    const nocustManager = new NOCUSTManager({
      rpcApi: limboweb3,
      operatorApiUrl: HUB_API_URL,
      contractAddress: HUB_CONTRACT_ADDRESS,
      });

    console.log("limbo Acc", limboweb3.eth.accounts.wallet[0])
    console.log("acc:", this.props.mainnetweb3.eth.getAccounts())
    console.log(nocustManager)

    this.state = {
      toAddress: (props.scannerState ? props.scannerState.toAddress : ""),
      nocustManager: nocustManager,
      addressRegistered: false,
      limboweb3: limboweb3,
      view: "main"
    }
  }

  componentDidMount(){
    console.log("YOUR MODULE MOUNTED, PROPS:",this.props)
    /*
        -- LOAD YOUR CONTRACT --
        Contract files loaded from:
        src/contracts/YourContract.abi
        src/contracts/YourContract.address
        src/contracts/YourContract.blocknumber.js // the block number it was deployed at (for efficient event loading)
        src/contracts/YourContract.bytecode.js // if you want to deploy the contract from the module (see deployYourContract())
    */

    setInterval(this.pollInterval.bind(this),10000)
    setTimeout(this.pollInterval.bind(this),30)
  }

  async pollInterval(){
    console.log("POLL")
    if(this.state){
      
      const limboBlockNumber = await this.state.limboweb3.eth.getBlockNumber()
      const mainnetBlockNumber = await this.props.mainnetweb3.eth.getBlockNumber()
      this.setState({mainnetBlockNumber, limboBlockNumber})
      
    }
  }

  async checkBalance(){
    const fethBalance = await this.state.nocustManager.getNOCUSTBalance(this.state.limboweb3.eth.accounts.wallet[0].address)
    const fdaiBalance = await this.state.nocustManager.getNOCUSTBalance(this.state.limboweb3.eth.accounts.wallet[0].address, TEST_DAI_ADDRESS)
    this.setState({fethBalance, fdaiBalance})
    console.log("fETH Balance:", fethBalance.toString())
  }

  async checkRegistration(){
    const account = this.state.limboweb3.eth.accounts.wallet[0]
    console.log(account.address)

    let addressRegistered = await this.state.nocustManager.isAddressRegistered(account.address)
    console.log("registration check", addressRegistered)
    this.setState({addressRegistered})
  }

  async registerWithHub(){
    console.log("trying to register")
    const account = this.state.limboweb3.eth.accounts.wallet[0]
    console.log("just before registration")
    await this.state.nocustManager.registerAddress(account.address)
    console.log("registered ETH")
    await this.state.nocustManager.registerAddress(account.address, TEST_DAI_ADDRESS)
    console.log("response from registration")
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
          <div className="send-to-address card w-100" style={{zIndex:1}}>
            <NavCard title={"Liquidity Network"} titleLink={""} goBack={this.props.goBack}/>
            <div className="form-group w-100">

              <div style={{width:"100%",textAlign:"center"}}>
                Free and instant off-chain transactions
                <Ruler/>
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
                </div>

                <Ruler/>

                  <Balance
                        icon={ethImg}
                        selected={true}
                        text="fETH"
                        amount={this.state.fethBalance*this.props.ethprice}
                        address={this.props.account}
                        dollarDisplay={this.props.dollarDisplay}
                      />
                  <Ruler/>
                  <Balance
                        icon={ethImg}
                        selected={true}
                        text="ETH"
                        amount={this.props.ethBalance*this.props.ethprice}
                        address={this.props.account}
                        dollarDisplay={this.props.dollarDisplay}
                      />
                  <Ruler/>
                  <Balance
                        icon={daiImg}
                        selected={true}
                        text="DAI"
                        amount={this.props.daiBalance}
                        address={this.props.account}
                        dollarDisplay={this.props.dollarDisplay}
                      />
                  <Ruler/>
                  <Balance
                        icon={daiImg}
                        selected={true}
                        text="fDAI"
                        amount={this.state.fdaiBalance}
                        address={this.props.account}
                        dollarDisplay={this.props.dollarDisplay}
                      />
                  <Ruler/>

                {sendButtons}

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

                <Ruler/>

                <div className="content bridge row">
                  <div className="col-4 p-1">
                    <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
                      this.registerWithHub()
                    }}>
                      <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                        <i className="fas fa-dog"></i> {"register"}
                      </Scaler>
                    </button>
                  </div>
                  <div className="col-4 p-1">
                    <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
                      this.checkRegistration()
                    }}>
                      <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                        <i className="fas fa-bone"></i> {"Check registration"}
                      </Scaler>
                    </button>
                  </div>
                  <div className="col-4 p-1">
                  <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
                    this.checkBalance()
                  }}>
                    <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                      <i className="fas fa-paw"></i> {"Check Balance"}
                    </Scaler>
                  </button>
                  </div>
                </div>

                <Ruler/>

                <button className="btn btn-large w-50" style={this.props.buttonStyle.secondary} onClick={async ()=>{

                  let hashSigned = this.props.web3.utils.sha3("jabronie pie"+Math.random())
                  let sig
                  //sign the hash using either the meta account OR the etherless account
                  if(this.props.privateKey){
                    sig = this.props.web3.eth.accounts.sign(hashSigned, this.props.privateKey);
                    sig = sig.signature
                  }else{
                    sig = await this.props.web3.eth.personal.sign(""+hashSigned,this.props.address)
                  }


                }}>
                  <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                    <i className="fas fa-pen"></i> {"sign a random hash"}
                  </Scaler>
                </button>

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

              <Ruler/>

              <div className="content row">
                <label htmlFor="amount_input">{"EXAMPLE ADDRESS INPUT:"}</label>
                <div className="input-group">
                  <input type="text" className="form-control" placeholder="0x..." value={this.state.toAddress}
                    ref={(input) => { this.addressInput = input; }}
                    onChange={event => this.setState({'toAddress': event.target.value})}
                  />
                  <div className="input-group-append" onClick={() => {
                    this.props.openScanner({view:"yourmodule"})
                  }}>
                    <span className="input-group-text" id="basic-addon2" style={this.props.buttonStyle.primary}>
                      <i style={{color:"#FFFFFF"}} className="fas fa-qrcode" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="content bridge row">
                <div className="col-6 p-1">
                  <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
                    alert('secondary')}
                  }>
                    <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                      <i className="fas fa-bell"></i> {"secondary"}
                    </Scaler>
                  </button>
                </div>
                <div className="col-6 p-1">
                <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
                  alert('actions')}
                }>
                  <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                    <i className="fas fa-hand-holding-usd"></i> {"actions"}
                  </Scaler>
                </button>
                </div>
              </div>

              <button className={'btn btn-lg w-100'} style={this.props.buttonStyle.primary}
                      onClick={()=>{alert("do something")}}>
                Primary CTA
              </button>

            </div>
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
                dollarDisplay={this.props.dollarDisplay}
                view={this.state.view}
                block={this.state.block}
                ensLookup={this.props.ensLookup}
                buttonStyle={this.props.buttonStyle}
                balance={this.props.balance}
                // web3={this.state.web3}
                address={this.props.address}
                send={this.props.send}
                // goBack={this.goBack.bind(this)}
                // changeView={this.changeView}
                changeAlert={this.props.changeAlert}
                dollarDisplay={this.props.dollarDisplay}
                // transactionsByAddress={this.state.transactionsByAddress}
                // fullTransactionsByAddress={this.state.fullTransactionsByAddress}
                // fullRecentTxs={this.state.fullRecentTxs}
                // recentTxs={this.state.recentTxs}
              />
              <Bottom
              action={this.goBack.bind(this)}
            />
            </div>

          </div>
        )
      case 'send_to_address':
        return (
          <div>
            <div className="send-to-address card w-100" style={{zIndex:1}}>
            
              <NavCard title={i18n.t('send_to_address_title')} goBack={this.goBack.bind(this)}/>
              <Balance
                icon={ethImg}
                selected={true}
                text="fETH"
                amount={this.state.fethBalance*this.props.ethprice}
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
                // ERC20TOKEN={ERC20TOKEN}
                buttonStyle={this.props.buttonStyle}
                balance={this.state.fethBalance}
                web3={this.props.web3}
                address={this.props.address}
                // send={send}
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
              <Balance
                icon={ethImg}
                selected={true}
                text="ETH"
                amount={this.props.EthBalance*this.props.ethprice}
                address={this.props.account}
                dollarDisplay={this.props.dollarDisplay}
              />
              <Ruler/>
              <Balance
                icon={ethImg}
                selected={true}
                text="fETH"
                amount={this.state.fethBalance*this.props.ethprice}
                address={this.props.account}
                dollarDisplay={this.props.dollarDisplay}
              />
              <Ruler/>
              <LiquidityDeposit
                nocustManager={this.state.nocustManager}
                convertToDollar={(dollar) => {return dollar}}
                dollarSymbol={"$"}
                parseAndCleanPath={this.props.parseAndCleanPath}
                openScanner={this.props.openScanner}
                scannerState={this.state.scannerState}
                ensLookup={this.props.ensLookup}
                // ERC20TOKEN={ERC20TOKEN}
                buttonStyle={this.props.buttonStyle}
                balance={this.state.fethBalance}
                web3={this.props.web3}
                address={this.props.address}
                // send={send}
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
          </div>
        )
        case 'withdraw':
        return (
          <div>
            <div className="send-to-address card w-100" style={{zIndex:1}}>
            
              <NavCard title={i18n.t('liquidity.withdraw.title')} goBack={this.goBack.bind(this)}/>
              <Balance
                icon={ethImg}
                selected={true}
                text="ETH"
                amount={this.props.EthBalance*this.props.ethprice}
                address={this.props.account}
                dollarDisplay={this.props.dollarDisplay}
              />
              <Ruler/>
              <Balance
                icon={ethImg}
                selected={true}
                text="fETH"
                amount={this.state.fethBalance*this.props.ethprice}
                address={this.props.account}
                dollarDisplay={this.props.dollarDisplay}
              />
              <Ruler/>
              {i18n.t('liquidity.withdraw.warning')}
            </div>
            <Bottom
              action={this.goBack.bind(this)}
            />
          </div>
        )
    }

  }
}
