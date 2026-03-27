import Web3 from "web3";
import Healthcare from "./contracts/Healthcare.json";

export const loadBlockchain = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask");
    return {};
  }

  const web3 = new Web3(window.ethereum);
  await window.ethereum.request({ method: "eth_requestAccounts" });

  const accounts = await web3.eth.getAccounts();
  const networkId = await web3.eth.net.getId();

  const deployedNetwork = Healthcare.networks[networkId];

  if (!deployedNetwork) {
    alert("Smart contract not deployed to this network");
    return {};
  }

  const contract = new web3.eth.Contract(
    Healthcare.abi,
    deployedNetwork.address
  );

  return { web3, contract, account: accounts[0] };
};
