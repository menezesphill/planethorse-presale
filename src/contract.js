const forwarderOrigin = "http://localhost:9010";
const Web3 = require("web3");
const MetaMaskOnboarding = require("@metamask/onboarding");
const NFTJson = require("../build/contracts/PlanetHorseNFT.json");
const USDJson = require("../build/contracts/tUSDC.json");

const initialize = () => {

  //Basic Actions Section
  const onboardButton = document.getElementById("connectButton");
  const chainIdlabel = document.getElementById("chainId");
  const networkLabel = document.getElementById("network");
  const contractStatus = document.getElementById("contractStatus");


  //Contract Mint Section
  
  const mintCommon = document.getElementById("mint_common");
  const mintRare = document.getElementById("mint_rare");
  const mintSRare = document.getElementById("mint_srare");
  const mintEpic = document.getElementById("mint_epic");
  const mintLegend = document.getElementById("mint_legend");
  const mintSLegend = document.getElementById("mint_slegend");

  //Created check function to see if the MetaMask extension is installed
  const isMetaMaskInstalled = () => {
    //Have to check the ethereum binding on the window object to see if it's installed
    const { ethereum } = window;
    return Boolean(ethereum && ethereum.isMetaMask);
  };

  //We create a new MetaMask onboarding object to use in our app
  const onboarding = new MetaMaskOnboarding({ forwarderOrigin });

  //This will start the onboarding proccess
  const onClickInstall = () => {
    onboardButton.innerText = "Onboarding in progress";
    onboardButton.disabled = true;
    //On this object we have startOnboarding which will start the onboarding process for our end user
    onboarding.startOnboarding();
  };

  const onClickConnect = async () => {
    try {
      // Will open the MetaMask UI
      // You should disable this button while the request is pending!
      await ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await ethereum.request({ method: "eth_accounts" });
      onboardButton.innerText = accounts[0];
      onboardButton.disabled = true;
    } catch (error) {
      console.error(error);
    }
  };

  const onboardButtonUpdate = async (accounts) => {
    onboardButton.innerText = accounts[0];
    onboardButton.disabled = true;
  };

  const defaultNetwork = async () => {
    try {
      // check if the chain to connect to is installed
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x13881" }], // chainId must be in hexadecimal numbers
      });
    } catch (error) {
      console.error(error);
    }
  };

  const MetaMaskClientCheck = async () => {
    //Now we check to see if Metmask is installed
    if (!isMetaMaskInstalled()) {
      //If it isn't installed we ask the user to click to install it
      onboardButton.innerText = "Click here to install MetaMask!";
      //When the button is clicked we call th is function
      onboardButton.onclick = onClickInstall;
      //The button is now disabled
      onboardButton.disabled = false;
    } else {
      //If MetaMask is installed we ask the user to connect to their wallet
      onboardButton.innerText = "Connect";
      //When the button is clicked we call this function to connect the users MetaMask Wallet
      onboardButton.onclick = onClickConnect;
      //The button is now disabled
      onboardButton.disabled = false;
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts[0]) {
      onboardButtonUpdate(accounts);
    }

    if (ethereum) {
      const chainId = await ethereum.request({ method: "eth_chainId" });
      //const USDCbalance = await window.token.methods.balanceOf(accounts[0]).call(); 
      chainIdlabel.innerHTML = parseInt(chainId, 16);
      networkLabel.innerHTML = chainIdtoName(parseInt(chainId, 16));
      //contractStatus.innetHTML = USDCbalance.toString();
      
      if (chainId !== "0x13881") {
        defaultNetwork();
      }

      ethereum.on("chainChanged", (chainId) => {
        // Handle the new chain.
        // Correctly handling chain changes can be complicated.
        // We recommend reloading the page unless you have good reason not to.
        window.location.reload();
      });

      ethereum.on("accountsChanged", (accounts) => {
        // Handle the new accounts, or lack thereof.
        // 'accounts' will always be an array, but it can be empty.

        if (accounts.length === 0) {
          window.location.reload();
        } else {
          onboardButtonUpdate(accounts);
          window.location.reload();
        }
      });



      window.web3 = new Web3(window.ethereum);
    }
  };

  // chainIdtoName is a map list to attribute each chain ID to
  // a specific chain name. A full chain id and name list can be found
  // at https://github.com/DefiLlama/chainlist/blob/main/components/chains.js

  function chainIdtoName(chainId) {
    var chainlist_map = [];

    chainlist_map[1] = "Ethereum Mainnet";
    chainlist_map[3] = "Ropsten Testnet";
    chainlist_map[56] = "BSC Mainnet";
    chainlist_map[97] = "BSC Testnet";
    chainlist_map[137] = "Polygon Mainnet";
    chainlist_map[1337] = "Ganache";
    chainlist_map[80001] = "Polygon Testnet (Mumbai)";


    return chainlist_map[chainId];
    
  }


  chainIdtoName(chainId);
  
  MetaMaskClientCheck();

web3 = new Web3(window.web3.currentProvider);
const tokenABI = USDJson.abi;
const contractABI = NFTJson.abi;
  
window.token = new web3.eth.Contract(tokenABI, USDJson.networks[80001].address);
window.contract = new web3.eth.Contract(contractABI, NFTJson.networks[80001].address);

const checkForApprovals = async () => {
  const accounts = await ethereum.request({ method: "eth_accounts" });
  contractStatus.innerHTML = (await window.token.methods.balanceOf(accounts[0]).call())/10e5;
  const allowance = await window.token.methods.allowance(accounts[0], window.contract.options.address).call();
  if(allowance == 0){
    mintCommon.innerText = "Approve";
    mintRare.innerText = "Approve";
    mintSRare.innerText = "Approve";
    mintEpic.innerText = "Approve";
    mintLegend.innerText = "Approve";
    mintSLegend.innerText = "Approve";
    return false;
  }
  return true;
}

checkForApprovals();


  mintCommon.onclick = async () => {
    const accounts = await ethereum.request({ method: "eth_accounts" });
    contractStatus.innerHTML = (await window.token.methods.balanceOf(accounts[0]).call())/10e5;

    if (mintCommon.innerText == "Approve"){
      await window.token.methods
      .approve(window.contract.options.address, web3.utils.toWei('10000000000', 'ether'))
      .send({from: accounts[0]})
      .on("error", function (error) {
        console.log(error);
      })
      .on("confirmation", function (confirmationNumber, receipt) {
        if (confirmationNumber < 1) {
          console.log(confirmationNumber);
          console.log(receipt);
        }
      });
    } else {
        await window.contract.methods
        .mint("common")
        .send({from: accounts[0]})
        .on("error", function (error) {
          console.log(error);
        })
        .on("confirmation", async function (confirmationNumber, receipt) {
          if (confirmationNumber < 1) {
            console.log(confirmationNumber);
            console.log(receipt);
          }
        })
        .then(async function () {
          contractStatus.innerHTML = (await window.token.methods.balanceOf(accounts[0]).call())/10e5;
        });
    }

  }

  mintRare.onclick = async () => {
    const accounts = await ethereum.request({ method: "eth_accounts" });
    contractStatus.innerHTML = (await window.token.methods.balanceOf(accounts[0]).call())/10e5;

    if (mintCommon.innerText == "Approve"){
      await window.token.methods
      .approve(window.contract.options.address, web3.utils.toWei('10000000000', 'ether'))
      .send({from: accounts[0]})
      .on("error", function (error) {
        console.log(error);
      })
      .on("confirmation", function (confirmationNumber, receipt) {
        if (confirmationNumber < 1) {
          console.log(confirmationNumber);
          console.log(receipt);
        }
      });
    } else {
        await window.contract.methods
        .mint("rare")
        .send({from: accounts[0]})
        .on("error", function (error) {
          console.log(error);
        })
        .on("confirmation", async function (confirmationNumber, receipt) {
          if (confirmationNumber < 1) {
            console.log(confirmationNumber);
            console.log(receipt);
          }
        })
        .then(async function () {
          contractStatus.innerHTML = (await window.token.methods.balanceOf(accounts[0]).call())/10e5;
        });
    }

  }

  mintSRare.onclick = async () => {
    const accounts = await ethereum.request({ method: "eth_accounts" });
    contractStatus.innerHTML = (await window.token.methods.balanceOf(accounts[0]).call())/10e5;

    if (mintCommon.innerText == "Approve"){
      await window.token.methods
      .approve(window.contract.options.address, web3.utils.toWei('10000000000', 'ether'))
      .send({from: accounts[0]})
      .on("error", function (error) {
        console.log(error);
      })
      .on("confirmation", function (confirmationNumber, receipt) {
        if (confirmationNumber < 1) {
          console.log(confirmationNumber);
          console.log(receipt);
        }
      });
    } else {
        await window.contract.methods
        .mint("srare")
        .send({from: accounts[0]})
        .on("error", function (error) {
          console.log(error);
        })
        .on("confirmation", async function (confirmationNumber, receipt) {
          if (confirmationNumber < 1) {
            console.log(confirmationNumber);
            console.log(receipt);
          }
        })
        .then(async function () {
          contractStatus.innerHTML = (await window.token.methods.balanceOf(accounts[0]).call())/10e5;
        });
    }

  }

  mintEpic.onclick = async () => {
    const accounts = await ethereum.request({ method: "eth_accounts" });
    contractStatus.innerHTML = (await window.token.methods.balanceOf(accounts[0]).call())/10e5;

    if (mintCommon.innerText == "Approve"){
      await window.token.methods
      .approve(window.contract.options.address, web3.utils.toWei('10000000000', 'ether'))
      .send({from: accounts[0]})
      .on("error", function (error) {
        console.log(error);
      })
      .on("confirmation", function (confirmationNumber, receipt) {
        if (confirmationNumber < 1) {
          console.log(confirmationNumber);
          console.log(receipt);
        }
      });
    } else {
        await window.contract.methods
        .mint("epic")
        .send({from: accounts[0]})
        .on("error", function (error) {
          console.log(error);
        })
        .on("confirmation", async function (confirmationNumber, receipt) {
          if (confirmationNumber < 1) {
            console.log(confirmationNumber);
            console.log(receipt);
          }
        })
        .then(async function () {
          contractStatus.innerHTML = (await window.token.methods.balanceOf(accounts[0]).call())/10e5;
        });
    }

  }

  mintLegend.onclick = async () => {
    const accounts = await ethereum.request({ method: "eth_accounts" });
    contractStatus.innerHTML = (await window.token.methods.balanceOf(accounts[0]).call())/10e5;

    if (mintCommon.innerText == "Approve"){
      await window.token.methods
      .approve(window.contract.options.address, web3.utils.toWei('10000000000', 'ether'))
      .send({from: accounts[0]})
      .on("error", function (error) {
        console.log(error);
      })
      .on("confirmation", function (confirmationNumber, receipt) {
        if (confirmationNumber < 1) {
          console.log(confirmationNumber);
          console.log(receipt);
        }
      });
    } else {
        await window.contract.methods
        .mint("legend")
        .send({from: accounts[0]})
        .on("error", function (error) {
          console.log(error);
        })
        .on("confirmation", async function (confirmationNumber, receipt) {
          if (confirmationNumber < 1) {
            console.log(confirmationNumber);
            console.log(receipt);
          }
        })
        .then(async function () {
          contractStatus.innerHTML = (await window.token.methods.balanceOf(accounts[0]).call())/10e5;
        });
    }

  }

  mintSLegend.onclick = async () => {
    const accounts = await ethereum.request({ method: "eth_accounts" });
    contractStatus.innerHTML = (await window.token.methods.balanceOf(accounts[0]).call())/10e5;

    if (mintCommon.innerText == "Approve"){
      await window.token.methods
      .approve(window.contract.options.address, web3.utils.toWei('10000000000', 'ether'))
      .send({from: accounts[0]})
      .on("error", function (error) {
        console.log(error);
      })
      .on("confirmation", function (confirmationNumber, receipt) {
        if (confirmationNumber < 1) {
          console.log(confirmationNumber);
          console.log(receipt);
        }
      });
    } else {
        await window.contract.methods
        .mint("slegend")
        .send({from: accounts[0]})
        .on("error", function (error) {
          console.log(error);
        })
        .on("confirmation", async function (confirmationNumber, receipt) {
          if (confirmationNumber < 1) {
            console.log(confirmationNumber);
            console.log(receipt);
          }
        })
        .then(async function () {
          contractStatus.innerHTML = (await window.token.methods.balanceOf(accounts[0]).call())/10e5;
        });
    }

  }

};

window.addEventListener("DOMContentLoaded", initialize);
