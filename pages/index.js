import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "../app/globals.css";
import { createWeb3Modal, defaultConfig } from "@web3modal/ethers/react";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers/react";
import { ABI, ADDRESS } from "../utils/ContractData.js";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const projectId = "d4e79a3bc1f5545a422926acb6bb88b8";

const sepolia = {
  chainId: 11155111, // Chain ID for Sepolia testnet
  name: "Sepolia",
  currency: "ETH",
  explorerUrl: "https://sepolia.etherscan.io",
  rpcUrl: "https://sepolia.infura.io/v3/7501310bfbe94f0fb0f9bf0c190a0a64",
};

const metadata = {
  name: "Tweet App",
  description: "tweet app",
  url: "https://x.com",
  icons: ["https://x.com"],
};

const web3Modal = createWeb3Modal({
  ethersConfig: defaultConfig({ metadata }),
  chains: [sepolia],
  projectId,
  enableAnalytics: true,
});

function useEthereumWallet() {
  const { address, chainId, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();

  const ethersProvider = isConnected
    ? new ethers.BrowserProvider(walletProvider)
    : null;
  const signer = isConnected ? ethersProvider.getSigner() : null;

  return { address, chainId, isConnected, ethersProvider, signer };
}

export default function Index() {
  const { address, chainId, isConnected, ethersProvider, signer } =
    useEthereumWallet();

  const [contract, setContract] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionCount, setTransactionCount] = useState(0);
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const getTransaction = async () => {
    if (contract) {
      try {
        const transactions = await contract.getTransactions();
        const formattedTransactions = transactions.map((tx) => ({
          from: tx.from,
          to: tx.to,
          amount: tx.amount.toString(), // Convert BigNumber to string (or .toNumber() if small)
          message: tx.message,
        }));
        setTransactions(formattedTransactions);
      } catch (error) {
        console.error("Error Get Transaction: ", error);
      }
    }
  };

  const getTransactionCount = async () => {
    if (contract) {
      try {
        const transactionCount = await contract.getTransactionCount();
        setTransactionCount(+transactionCount.toString());
      } catch (error) {
        console.error("Error Get Transaction Count: ", error);
      }
    }
  };

  const addTransaction = async () => {
    if (contract) {
      try {
        await contract.addTransaction(toAddress, amount, message);
        contract.on("addTransactionEvent", (from, to, amount, message) => {
          console.log(
            `addTransactionEvent executed: from ${from} to ${to} for ${amount} ETH with message '${message}'`
          );
        });
      } catch (error) {
        console.error("Error Add Transaction: ", error);
      }
    }
  };

  const transfer = async () => {
    if (contract) {
      try {
        await contract.transferEther(toAddress, { value: amount });
        contract.on("transferEvent", (from, to, amount) => {
          console.log(
            `TransferEvent executed: from ${from} to ${to} for ${amount} ETH`
          );
          addTransaction();
        });
      } catch (error) {
        console.error("Error Transfer: ", error);
      }
    }
  };

  const connectEthereumWallet = async () => {
    try {
      const instance = await web3Modal.open();
      if (instance) {
        const provider = new ethers.BrowserProvider(instance);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
      } else {
        throw new Error("No provider returned from Web3Modal.");
      }
    } catch (err) {
      console.error("Ethereum wallet connection failed:", err);
    }
  };

  const connectContract = async () => {
    if (isConnected && contract) {
      console.log("getting data..");
      getTransaction();
      getTransactionCount();
    }
    if (isConnected && !contract) {
      const signer = ethersProvider?.getSigner();
      const contract = new ethers.Contract(ADDRESS, ABI, await signer);
      setContract(contract);
    }
    setIsMounted(true);
  };

  useEffect(() => {
    connectContract();
  }, [contract]);

  if (!isMounted) {
    return null;
  }

  return (
    <section className="bg-[#3C3D37] w-full min-h-screen p-8 px-14 flex flex-col items-center justify-between gap-4">
      <Navbar
        connectWallet={() => connectEthereumWallet()}
        address={address}
        tes="tes"
      />
      <div>
        <p>Address: {address}</p>
        <div className="flex gap-2">
          <input
            className="bg-black text-white"
            placeholder="address"
            type="text"
            onChange={(e) => setToAddress(e.target.value)}
          />
          <input
            className="bg-black text-white"
            placeholder="amount"
            type="number"
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            className="bg-black text-white"
            placeholder="message"
            type="text"
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={transfer}>Transfer</button>
        </div>
      </div>
      <div>
        <p>Transaction Count: {transactionCount}</p>
        {transactions?.map((item, index) => (
          <div key={index}>{item.message}</div>
        ))}
      </div>
      <Footer></Footer>
    </section>
  );
}
