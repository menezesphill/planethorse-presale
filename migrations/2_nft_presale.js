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
      "https://gateway.pinata.cloud/ipfs/QmYomJQPZ4cxPAu2utmLseLJ5JKqvcopiuqhZKwrjQjdBq/",
      false));  
};