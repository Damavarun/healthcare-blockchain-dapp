import Web3 from "web3";

const getWeb3 = async () => {
  try {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();
      return { web3, accounts };
    } else if (window.web3) {
      const web3 = window.web3;
      const accounts = await web3.eth.getAccounts();
      return { web3, accounts };
    } else {
      alert("MetaMask not detected! Please install it.");
      return null;
    }
  } catch (error) {
    console.error("Error loading Web3:", error);
    return null;
  }
};

export default getWeb3;
