const tUSDC = artifacts.require("tUSDC");
const PlanetHorseNFT = artifacts.require("PlanetHorseNFT");

module.exports = function (deployer) {
  deployer
  .deploy(
      tUSDC, 
      "Testnet USDC", 
      "tUSDC", 
      6, 
      1e14)
  .then(() => 
  deployer
  .deploy(
      PlanetHorseNFT, 
      tUSDC.address,
      7500,
      15,
      1649271018,
      1649271018,
      1649271018,
      "https://opensea.mypinata.cloud/ipfs/QmUiPkJJih1YznUWYCyLyLKfhEhr7AJpNaVzAgTpUQTVtF/",
      false));  
};