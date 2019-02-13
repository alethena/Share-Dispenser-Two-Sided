var AlethenaShares = artifacts.require("../contracts/ALEQ/AlethenaShares.sol");
var ShareDispenser = artifacts.require("../contracts/ShareDispenser.sol");
var CryptoFranc = artifacts.require("../contracts/XCHF/CryptoFranc.sol");

module.exports = function(deployer) {
  deployer.deploy(AlethenaShares).then(()=>{return deployer.deploy(CryptoFranc, 'Test XCHF', 0)}).then(
    ()=>{return deployer.deploy(ShareDispenser, CryptoFranc.address, AlethenaShares.address, "0xaF897e6DEE7d36130a3103D0E9B2299b5199F338")});
  };