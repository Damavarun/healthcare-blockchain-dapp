const AccessNFT = artifacts.require("AccessNFT");
const Healthcare = artifacts.require("Healthcare");
const Telemedicine = artifacts.require("Telemedicine");

module.exports = async function (deployer) {
  // 1. Deploy AccessNFT
  await deployer.deploy(AccessNFT);
  const accessNFT = await AccessNFT.deployed();

  // 2. Deploy Healthcare, passing the AccessNFT address to its constructor
  await deployer.deploy(Healthcare, accessNFT.address);
  
  // 3. Deploy Telemedicine
  await deployer.deploy(Telemedicine);
};