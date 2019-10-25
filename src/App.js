import React, { Component } from 'react';
import { ContractLoader, Dapparatus, Transactions, Gas, Address, Events, Blockie, Scaler } from "dapparatus";
import Web3 from 'web3';
import axios from 'axios';
import { I18nextProvider } from 'react-i18next';
import gasless from 'tabookey-gasless';
import { eth } from '@burner-wallet/assets';

import i18n from './i18n';
import './App.scss';
import Header from './components/Header';
import NavCard from './components/NavCard';
import SendToAddress from './components/SendToAddress';
import WithdrawFromPrivate from './components/WithdrawFromPrivate';
import RequestFunds from './components/RequestFunds';
import Apps from './components/Apps'
import Balance from "./components/Balance";
import Ruler from "./components/Ruler";
import Receipt from "./components/Receipt";
import MainCard from './components/MainCard';
import Advanced from './components/Advanced';
import Footer from './components/Footer';
import Loader from './components/Loader';
import burnerlogo from './burnerwallet.png';
import BurnWallet from './components/BurnWallet'
import Bottom from './components/Bottom';
import namehash from 'eth-ens-namehash'
import incogDetect from './services/incogDetect.js'
import core, { mainAsset as dai } from './core';

import ethImg from './images/ethereum.png';
import daiImg from './images/dai.jpg';
import Wyre from './services/wyre';
import LiquidityNetwork from './components/LiquidityNetwork';

//https://github.com/lesnitsky/react-native-webview-messaging/blob/v1/examples/react-native/web/index.js
//import RNMessageChannel from 'react-native-webview-messaging';
const RNMessageChannel = false //disable React Native for now, it is breaking Safari

let base64url = require('base64url')
const EthCrypto = require('eth-crypto');

const MAINNET_CHAIN_ID = '1';


let WEB3_PROVIDER = process.env.REACT_APP_WEB3_PROVIDER
let LOADERIMAGE = burnerlogo
let HARDCODEVIEW = "liquidity"// = "loader"// = "receipt"
let FAILCOUNT = 0

let mainStyle = {
  width:"100%",
  height:"100%",
  backgroundImage:"linear-gradient(#292929, #191919)",
  backgroundColor:"#191919",
  hotColor:"#F69E4D",
  mainColorAlt:"#fa7d36",
  mainColor:"#F76B1C",
}

let title = i18n.t('app_name')
let titleImage = (
  <span style={{paddingRight:20,paddingLeft:16}}><i className="fas fa-fire" /></span>
)

let innerStyle = {
  maxWidth:740,
  margin:'0 auto',
  textAlign:'left'
}

let buttonStyle = {
  primary: {
    backgroundImage:"linear-gradient("+mainStyle.mainColorAlt+","+mainStyle.mainColor+")",
    backgroundColor:mainStyle.mainColor,
    color:"#FFFFFF",
    whiteSpace:"nowrap",
    cursor:"pointer",
  },
  secondary: {
    border:"2px solid "+mainStyle.mainColor,
    color:mainStyle.mainColor,
    whiteSpace:"nowrap",
    cursor:"pointer",
  }
}

const invLogoStyle = {
  maxWidth:50,
  maxHeight:50,
}

let metaReceiptTracker = {}

let dollarSymbol = "$"
let dollarConversion = 1.0
//let dollarSymbol = "€"
//let dollarConversion = 0.88
let convertToDollar = (amount)=>{
  return (parseFloat(amount)/dollarConversion)
}
let convertFromDollar = (amount)=>{
  return (parseFloat(amount)*dollarConversion)
}
let dollarDisplay = (amount)=>{
  let floatAmount = parseFloat(amount)
  amount = Math.floor(amount*100)/100
  return dollarSymbol+convertFromDollar(amount).toFixed(2)
}

let interval
let intervalLong
let originalStyle = {}

class App extends Component {
  constructor(props) {


    console.log("[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[["+title+"]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]")
    let view = 'main'
    let cachedView = localStorage.getItem("view")
    let cachedViewSetAge = Date.now() - localStorage.getItem("viewSetTime")
    if(HARDCODEVIEW){
      view = HARDCODEVIEW
    }else if(cachedViewSetAge < 300000 && cachedView&&cachedView!=0){
      view = cachedView
    }
    console.log("CACHED VIEW",view)
    super(props);
    this.state = {
      web3: false,
      account: false,
      gwei: 1.1,
      view: view,
      alert: null,
      loadingTitle:'loading...',
      title: title,
      extraHeadroom:0,
      ethprice: 0.00,
      hasUpdateOnce: false,
    };
    this.alertTimeout = null;

    try{
      RNMessageChannel.on('json', update => {
        try{
          let safeUpdate = {}
          if(update.title) safeUpdate.title = update.title
          if(update.extraHeadroom) safeUpdate.extraHeadroom = update.extraHeadroom
          if(update.possibleNewPrivateKey) safeUpdate.possibleNewPrivateKey = update.possibleNewPrivateKey
          this.setState(safeUpdate,()=>{
            if(this.state.possibleNewPrivateKey){
              this.dealWithPossibleNewPrivateKey()
            }
          })
        }catch(e){console.log(e)}
      })
    }catch(e){console.log(e)}

  }

  parseAndCleanPath(path){
    let parts = path.split(";")
    //console.log("PARTS",parts)
    let state = {}
    if(parts.length>0){
      state.toAddress = parts[0].replace("/","")
    }
    if(parts.length>=2){
      state.amount = parts[1]
    }
    if(parts.length>2){
      state.message = decodeURI(parts[2]).replaceAll("%23","#").replaceAll("%3B",";").replaceAll("%3A",":").replaceAll("%2F","/")
    }
    if(parts.length>3){
      state.extraMessage = decodeURI(parts[3]).replaceAll("%23","#").replaceAll("%3B",";").replaceAll("%3A",":").replaceAll("%2F","/")
    }
    //console.log("STATE",state)
    return state;
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

  updateDimensions() {
    //force it to rerender when the window is resized to make sure qr fits etc
    this.forceUpdate();
  }

  saveKey(update){
    this.setState(update)
  }

  detectContext(){
    console.log("DETECTING CONTEXT....")
    //snagged from https://stackoverflow.com/questions/52759238/private-incognito-mode-detection-for-ios-12-safari
    incogDetect(async (result)=>{
      if(result){
        console.log("INCOG")
        document.getElementById("main").style.backgroundImage = "linear-gradient(#862727, #671c1c)"
        document.body.style.backgroundColor = "#671c1c"
        var contextElement = document.getElementById("context")
        contextElement.innerHTML = 'INCOGNITO';
      }else if (typeof web3 !== 'undefined') {
        console.log("NOT INCOG",this.state.metaAccount)
        try{
          if (window.web3 && window.web3.currentProvider && window.web3.currentProvider.isMetaMask === true && window.web3.eth && typeof window.web3.eth.getAccounts == "function" && isArrayAndHasEntries(await window.web3.eth.getAccounts()))  {
            document.getElementById("main").style.backgroundImage = "linear-gradient(#553319, #ca6e28)"
            document.body.style.backgroundColor = "#ca6e28"
            var contextElement = document.getElementById("context")
            contextElement.innerHTML = 'METAMASK';
          } else if(this.state.account && !this.state.metaAccount) {
            console.log("~~~*** WEB3",this.state.metaAccount,result)
            document.getElementById("main").style.backgroundImage = "linear-gradient(#234063, #305582)"
            document.body.style.backgroundColor = "#305582"
            var contextElement = document.getElementById("context")
            contextElement.innerHTML = 'WEB3';
          }
        }catch(ee){
          console.log("CONTEXT ERR",ee)
        }
        console.log("done with context")
      }
    })
  }

  componentDidMount(){

    document.body.style.backgroundColor = mainStyle.backgroundColor

    Wyre.configure();

    this.detectContext()

    console.log("document.getElementsByClassName('className').style",document.getElementsByClassName('.btn').style)
    window.addEventListener("resize", this.updateDimensions.bind(this));
    if(window.location.pathname){
      console.log("PATH",window.location.pathname,window.location.pathname.length,window.location.hash)
      
      if(window.location.pathname.indexOf("/pk")>=0){
        let tempweb3 = new Web3();
        let base64encodedPK = window.location.hash.replace("#","")
        let rawPK
        if(base64encodedPK.length==64||base64encodedPK.length==66){
          console.log("raw pk ",base64encodedPK)
          rawPK=base64encodedPK
        }else{
          rawPK=tempweb3.utils.bytesToHex(base64url.toBuffer(base64encodedPK))
        }
        this.setState({possibleNewPrivateKey:rawPK})
        window.history.pushState({},"", "/");
      }else if(window.location.pathname.length==43){
        this.changeView('send_to_address')
        console.log("CHANGE VIEW")
      }else if(
        (window.location.pathname.length>=65&&window.location.pathname.length<=67&&window.location.pathname.indexOf(";")<0) ||
        (window.location.hash.length>=65 && window.location.hash.length <=67 && window.location.hash.indexOf(";")<0)
      ){
        console.log("incoming private key")
        let privateKey = window.location.pathname.replace("/","")
        if(window.location.hash){
          privateKey = window.location.hash
        }
        privateKey = privateKey.replace("#","")
        if(privateKey.indexOf("0x")!=0){
          privateKey="0x"+privateKey
        }
        //console.log("!!! possibleNewPrivateKey",privateKey)
        this.setState({possibleNewPrivateKey:privateKey})
        window.history.pushState({},"", "/");
      }else{
        let parts = window.location.pathname.split(";")
        console.log("PARTS",parts)
        if(parts.length>=2){
          let sendToAddress = parts[0].replace("/","")
          let sendToAmount = parts[1]
          let extraData = ""
          if(parts.length>=3){
            extraData = parts[2]
          }
          if((parseFloat(sendToAmount)>0 || extraData) && sendToAddress.length==42){
            this.changeView('send_to_address')
          }
        }
      }
    }
    setTimeout(this.poll.bind(this),150)
    setTimeout(this.poll.bind(this),650)
    interval = setInterval(this.poll.bind(this),1500)
    intervalLong = setInterval(this.longPoll.bind(this),45000)
    setTimeout(this.longPoll.bind(this),150)

    this.connectToRPC()
  }

  connectToRPC(){
    const { Contract } = core.getWeb3(MAINNET_CHAIN_ID).eth;
    const ensContract = new Contract(require("./contracts/ENS.abi.js"),require("./contracts/ENS.address.js"))
    let daiContract
    try{
      daiContract = new Contract(require("./contracts/StableCoin.abi.js"),"0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359")
    }catch(e){
      console.log("ERROR LOADING DAI Stablecoin Contract",e)
    }
    this.setState({ ensContract, daiContract });
  }

  componentWillUnmount() {
    clearInterval(interval)
    clearInterval(intervalLong)
    window.removeEventListener("resize", this.updateDimensions.bind(this));
  }

  async poll() {

    //console.log(">>>>>>> <<< >>>>>> Looking into iframe...")
    //console.log(document.getElementById('galleassFrame').contentWindow['web3'])

    if(this.state.account){
      const ethBalance = await eth.getDisplayBalance(this.state.account, 20);
      const daiBalance = await dai.getDisplayBalance(this.state.account, 20);

      this.setState({
        ethBalance,
        daiBalance,
        hasUpdateOnce:true
      });

    }

  }

  longPoll() {
    axios.get("https://api.coinmarketcap.com/v2/ticker/1027/")
    .then((response)=>{
      let ethprice = response.data.data.quotes.USD.price
      this.setState({ethprice})
    })
  }

  setPossibleNewPrivateKey(value){
    this.setState({possibleNewPrivateKey:value},()=>{
      this.dealWithPossibleNewPrivateKey()
    })
  }

  async dealWithPossibleNewPrivateKey(){
    //this happens as page load and you need to wait until
    if(this.state && this.state.hasUpdateOnce){
      if(this.state.metaAccount && this.state.metaAccount.privateKey.replace("0x","") == this.state.possibleNewPrivateKey.replace("0x","")){
        this.setState({possibleNewPrivateKey:false})
        this.changeAlert({
          type: 'warning',
          message: 'Imported identical private key.',
        });
      }else{

        console.log("Checking on pk import...")
        console.log("this.state.metaAccount",this.state.metaAccount)
        console.log("this.state.daiBalance",this.state.daiBalance)
        

        if(!this.state.metaAccount || this.state.ethBalance>=0.0005 || this.state.daiBalance>=0.05){
          this.setState({possibleNewPrivateKey:false,withdrawFromPrivateKey:this.state.possibleNewPrivateKey},()=>{
            this.changeView('withdraw_from_private')
          })
        }else{

          localStorage.setItem(this.state.account+"loadedBlocksTop","")
          localStorage.setItem(this.state.account+"recentTxs","")
          localStorage.setItem(this.state.account+"transactionsByAddress","")
          this.setState({
            possibleNewPrivateKey:false,
            newPrivateKey:this.state.possibleNewPrivateKey,
            recentTxs:[],
            transactionsByAddress:{},
            fullRecentTxs:[],
            fullTransactionsByAddress:{},
          })

        }
      }
    }else{
      setTimeout(this.dealWithPossibleNewPrivateKey.bind(this),500)
    }


  }

  componentDidUpdate(prevProps, prevState) {
    let { network, web3 } = this.state;
    if (web3 && network !== prevState.network /*&& !this.checkNetwork()*/) {
      console.log("WEB3 DETECTED BUT NOT RIGHT NETWORK",web3, network, prevState.network);
      //this.changeAlert({
      //  type: 'danger',
      //  message: 'Wrong Network. Please use Custom RPC endpoint: https://dai.poa.network or turn off MetaMask.'
      //}, false)
    }
  };

  checkNetwork() {
    let { network } = this.state;
    return network === "Rinkeby" || network === "Unknown";
  }

  async ensLookup(name){
    let hash = namehash.hash(name)
    console.log("namehash",name,hash)
    let resolver = await this.state.ensContract.methods.resolver(hash).call()
    if(resolver=="0x0000000000000000000000000000000000000000") return "0x0000000000000000000000000000000000000000"
    console.log("resolver",resolver)
    const { Contract } = core.getWeb3(MAINNET_CHAIN_ID).eth;
    const ensResolver = new Contract(require("./contracts/ENSResolver.abi.js"),resolver)
    console.log("ensResolver:",ensResolver)
    return ensResolver.methods.addr(hash).call()
  }

  changeView = (view,cb) => {
    if(view=="main"){
      localStorage.setItem("view",view)//some pages should be sticky because of metamask reloads
      localStorage.setItem("viewSetTime",Date.now())
    }

    this.changeAlert(null);
    console.log("Setting state",view)
    this.setState({ view, scannerState:false },cb);
  };

  changeAlert = (alert, hide=true) => {
    clearTimeout(this.alertTimeout);
    this.setState({ alert });
    if (alert && hide) {
      this.alertTimeout = setTimeout(() => {
        this.setState({ alert: null });
      }, 2000);
    }
  };

  goBack(){
    console.log("GO BACK")
    this.changeView('main')
    setTimeout(()=>{window.scrollTo(0,0)},60)
  }

  async decryptInput(input){
    let key = input.substring(0,32)
    //console.log("looking in memory for key",key)
    let cachedEncrypted = this.state[key]
    if(!cachedEncrypted){
      //console.log("nothing found in memory, checking local storage")
      cachedEncrypted = localStorage.getItem(key)
    }
    if(cachedEncrypted){
      return cachedEncrypted
    }else{
      if(this.state.metaAccount){
        try{
          let parsedData = EthCrypto.cipher.parse(input.substring(2))
          const endMessage = await EthCrypto.decryptWithPrivateKey(
            this.state.metaAccount.privateKey, // privateKey
            parsedData // encrypted-data
          );
          return  endMessage
        }catch(e){}
      }else{
        //no meta account? maybe try to setup signing keys?
        //maybe have a contract that tries do decrypt? \
      }
    }
    return false
  }


  render() {
    let {
      web3, account, tx, gwei, block, avgBlockTime, etherscan, metaAccount, burnMetaAccount, view, alert, send
    } = this.state;

    let web3_setup = ""
    if(web3){
      web3_setup = (
        <div>
        <ContractLoader
        key="ContractLoader"
        config={{DEBUG: true}}
        web3={web3}
        require={path => {
          return require(`${__dirname}/${path}`)
        }}
        onReady={(contracts, customLoader) => {
          console.log("contracts loaded", contracts)
          this.setState({contracts: contracts,customLoader: customLoader}, async () => {
            console.log("Contracts Are Ready:", contracts)
          })
        }}
        />
        {/* <Transactions
        key="Transactions"
        config={{DEBUG: false, hide: true}}
        account={account}
        gwei={gwei}
        web3={web3}
        block={block}
        avgBlockTime={avgBlockTime}
        etherscan={etherscan}
        metaAccount={metaAccount}
        onReady={(state) => {
          console.log("Transactions component is ready:", state);
          console.log(state)
          this.setState(state)

        }}
        onReceipt={(transaction, receipt) => {
          // this is one way to get the deployed contract address, but instead I'll switch
          //  to a more straight forward callback system above
          console.log("Transaction Receipt", transaction, receipt)
        }}
        /> */}
        </div>
      )
    }


    let extraHead = ""
    if(this.state.extraHeadroom){
      extraHead = (
        <div style={{marginTop:this.state.extraHeadroom}}>
        </div>
      )
    }

    let header = (
      <div style={{height:50}}>
      </div>
    )

    let totalBalance = parseFloat(this.state.ethBalance) * parseFloat(this.state.ethprice) + parseFloat(this.state.daiBalance)

    if(web3){
      header = (
        <div>
        <Header
        openScanner={this.openScanner.bind(this)}
        network={this.state.network}
        total={totalBalance}
        ens={this.state.ens}
        title={this.state.title}
        titleImage={titleImage}
        mainStyle={mainStyle}
        address={this.state.account}
        changeView={this.changeView}
        view={this.state.view}
        dollarDisplay={dollarDisplay}
        />
        </div>
      )
    }

    return (
      <I18nextProvider i18n={i18n}>
      <div id="main" style={mainStyle}>
        <div style={innerStyle}>
          {extraHead}
          {web3_setup}
        <div>
      {header}

      {web3 /*&& this.checkNetwork()*/ && (() => {
        //console.log("VIEW:",view)

        let selected = "DAI"

        switch(view) {
          case 'main':
          return (
            <div>
            <div className="main-card card w-100" style={{zIndex:1}}>

            <Balance
            icon={daiImg}
            selected={selected}
            text="DAI"
            amount={this.state.daiBalance}
            address={account}
            dollarDisplay={dollarDisplay}
            />
            <Ruler/>
            <Balance
            icon={ethImg}
            selected={selected}
            text="ETH"
            amount={parseFloat(this.state.ethBalance) * parseFloat(this.state.ethprice)}
            address={account}
            dollarDisplay={dollarDisplay}
            />
            <Ruler/>


            <MainCard
            buttonStyle={buttonStyle}
            address={account}
            changeAlert={this.changeAlert}
            changeView={this.changeView}
            dollarDisplay={dollarDisplay}
            />

            </div>
            <Bottom
            icon={"wrench"}
            text={i18n.t('advance_title')}
            action={()=>{
              this.changeView('advanced')
            }}
            />
            </div>
          );
          case 'advanced':
          return (
            <div>
            <div className="main-card card w-100" style={{zIndex:1}}>

            <NavCard title={i18n.t('advance_title')} goBack={this.goBack.bind(this)}/>
            <Advanced
            buttonStyle={buttonStyle}
            address={account}
            changeView={this.changeView}
            privateKey={metaAccount.privateKey}
            changeAlert={this.changeAlert}
            goBack={this.goBack.bind(this)}
            setPossibleNewPrivateKey={this.setPossibleNewPrivateKey.bind(this)}
            />
            </div>
            <Bottom
            action={()=>{
              this.changeView('main')
            }}
            />
            </div>
          )
          case 'apps':
          return (
            <div>
            <div className="main-card card w-100" style={{zIndex:1}}>

            <NavCard title={"Apps & Games"} goBack={this.goBack.bind(this)} />
            <Apps
              privateKey={metaAccount.privateKey}
            customLoader={this.state.customLoader}
            changeView={this.changeView}
            mainStyle={mainStyle}
            ethprice={this.state.ethprice}
            ethBalance={this.state.ethBalance}
            daiBalance={this.state.daiBalance}
            daiContract={this.state.daiContract}
            ensContract={this.state.ensContract}
            isAdmin={this.state.isAdmin}
            contracts={this.state.contracts}
            buttonStyle={buttonStyle}
            changeAlert={this.changeAlert}
            setGwei={this.setGwei}
            network={this.state.network}
            web3={this.state.web3}
            nativeSend={this.state.nativeSend}
            address={account}
            goBack={this.goBack.bind(this)}
            dollarDisplay={dollarDisplay}
            />
            </div>
            <Bottom
            action={this.goBack.bind(this)}
            />
            </div>
          );
          case 'liquidity':
            if(!this.state || !this.state.customLoader  || !this.state.contracts || !this.state.network){
              return <Loader loaderImage={LOADERIMAGE} mainStyle={mainStyle}/>
            }else{
              return (
                <div>
                    <LiquidityNetwork
                      privateKey={metaAccount.privateKey}

                      web3={this.state.web3}

                      address={account}

                      network={this.state.network}
                      block={this.state.block}

                      mainnetweb3={core.getWeb3(MAINNET_CHAIN_ID)}

                      daiContract={this.state.daiContract}
                      ensContract={this.state.ensContract}
                      ensLookup={this.ensLookup.bind(this)}

                      ethBalance={this.state.ethBalance}
                      daiBalance={this.state.daiBalance}

                      eth={eth}
                      dai={dai}
                      ethprice={this.state.ethprice}


                      setGwei={this.setGwei}
                      gwei={this.state.gwei}

                      parseAndCleanPath={this.parseAndCleanPath.bind(this)}
                      openScanner={this.openScanner.bind(this)}
                      scannerState={this.state.scannerState}

                      mainStyle={mainStyle}
                      buttonStyle={buttonStyle}
                      changeAlert={this.changeAlert}
                      goBack={this.goBack.bind(this)}
                      dollarDisplay={dollarDisplay}
                    />
                </div>
              )
            }
          case 'loader':
          return (
            <div>
            <div style={{zIndex:1,position:"relative",color:"#dddddd"}}>

            <NavCard title={"Sending..."} goBack={this.goBack.bind(this)} darkMode={true}/>
            </div>
            <Loader loaderImage={LOADERIMAGE} mainStyle={mainStyle}/>
            </div>
          );
          case 'reader':
          return (
            <div>
            <div style={{zIndex:1,position:"relative",color:"#dddddd"}}>

            <NavCard title={"Reading QRCode..."} goBack={this.goBack.bind(this)} darkMode={true}/>
            </div>
            <Loader loaderImage={LOADERIMAGE}  mainStyle={mainStyle}/>
            </div>
          );
          default:
          return (
            <div>unknown view</div>
          )
        }

      })()}
      { ( false ||  !web3 /*|| !this.checkNetwork() */) &&
        <div>
        <Loader loaderImage={LOADERIMAGE} mainStyle={mainStyle}/>
        </div>
      }
      { alert && <Footer alert={alert} changeAlert={this.changeAlert}/> }
      </div>



      <Dapparatus
      config={{
        DEBUG: false,
        hide: true,
        requiredNetwork: ['Unknown', 'Rinkeby'],
        metatxAccountGenerator: false,
      }}
      //used to pass a private key into Dapparatus
      newPrivateKey={this.state.newPrivateKey}
      fallbackWeb3Provider={WEB3_PROVIDER}
      onUpdate={async (state) => {
        console.log("Dapparatus update",state)

        if (state.web3Provider) {
          state.web3 = new Web3(state.web3Provider)

          this.setState(state,()=>{
            this.detectContext()
            //console.log("state set:",this.state)
            if(this.state.possibleNewPrivateKey){
              this.dealWithPossibleNewPrivateKey()
            }
          })
        }
      }}
      />
      <Gas
      network={this.state.network}
      onUpdate={(state)=>{
        console.log("Gas price update:",state)
        this.setState(state,()=>{
          this.state.gwei += 0.1
          console.log("GWEI set:",this.state)
        })
      }}
      />

      <div id="context" style={{position:"absolute",right:5,top:-15,opacity:0.2,zIndex:100,fontSize:60,color:'#FFFFFF'}}>
      </div>

      </div>
      </div>
      </I18nextProvider>
    )
  }
}


function isArrayAndHasEntries(array){
  if (array === undefined || array.length == 0) {
    // array empty or does not exist
    return false;
  }
  return true;
}

export default App;

String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};
