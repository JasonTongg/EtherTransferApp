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
import Image from "next/image";
import { FaIgloo, FaWallet } from "react-icons/fa6";
import EthVector from "../public/ethGif.gif";
import { SiEthereum } from "react-icons/si";
import Wallet from "../public/wallet.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "black",
  border: "2px solid #b9b9b9",
  boxShadow: 24,
  color: "#b9b9b9",
  borderRadius: "20px",
  fontSize: "13px",
  p: 4,
};

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
  const [balance, setBalance] = useState(0);
  const [message, setMessage] = useState("");
  const [messageResponse, setMessageResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const getTransaction = async () => {
    console.log("Getting Contract");
    if (contract) {
      console.log("There is contract");
      try {
        console.log("Start getting contract");
        const transactions = await contract.getTransactions();
        const formattedTransactions = transactions.map((tx) => ({
          from: tx.from,
          to: tx.to,
          amount: tx.amount.toString(), // Convert BigNumber to string (or .toNumber() if small)
          message: tx.message,
        }));

        console.log("set Transaction");
        setTransactions(formattedTransactions);
        console.log("set Transaction done");
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
        await contract.addTransaction(
          toAddress,
          ethers.parseEther(amount),
          message
        );
        contract.on("addTransactionEvent", (from, to, amount, message) => {
          console.log(
            `addTransactionEvent executed: from ${from} to ${to} for ${amount} ETH with message '${message}'`
          );
          getTransaction();
          toast.success("Transaction Has Been Added to Sepolia Blockchain...", {
            theme: "dark",
          });
        });
      } catch (error) {
        console.error("Error Add Transaction: ", error);
      }
    }
  };

  const transfer = async () => {
    const newAmount = ethers.parseEther(amount);
    console.log(newAmount);
    console.log(amount);
    if (contract) {
      try {
        await contract.transferEther(toAddress, {
          value: newAmount,
        });
        contract.on("transferEvent", (from, to, amount) => {
          console.log(
            `TransferEvent executed: from ${from} to ${to} for ${amount} ETH`
          );
          addTransaction();
          toast.success("Transfer Sepolia to " + toAddress + "Successfull", {
            theme: "dark",
          });
          setIsLoading(false);
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
        toast.success("Wallet Connect Successfull", {
          theme: "dark",
        });
      } else {
        throw new Error("No provider returned from Web3Modal.");
      }
    } catch (err) {
      console.error("Ethereum wallet connection failed:", err);
    }
  };

  const connectContract = async () => {
    if (isConnected && contract) {
      console.log("before get transaction");
      getTransaction();
      console.log("after get transaction");
      getTransactionCount();
      getBalance();
    }
    if (isConnected && !contract) {
      const signer = ethersProvider?.getSigner();
      const contract = new ethers.Contract(ADDRESS, ABI, await signer);
      setContract(contract);
      getTransaction();
      getTransactionCount();
    }
    setIsMounted(true);
  };

  const getBalance = async () => {
    if (isConnected && ethersProvider) {
      try {
        const balance = await ethersProvider.getBalance(address);
        setBalance(ethers.formatEther(balance));
      } catch (error) {
        console.error("Error fetching balance: ", error);
      }
    }
  };

  useEffect(() => {
    connectContract();
  }, [contract, isConnected]);

  if (!isMounted) {
    return null;
  }

  return (
    <section className="background bg-black w-full min-h-screen p-8 px-14 flex flex-col items-center justify-between gap-4">
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-description">
            {messageResponse}
          </Typography>
        </Box>
      </Modal>
      <ToastContainer />
      <Navbar
        connectWallet={() => connectEthereumWallet()}
        address={address}
        tes="tes"
      />
      <div
        className="w-full flex flex-col m-8 items-center justify-center"
        id="transfer"
      >
        <h1 className="text-5xl mb-4 text-[#B9B9B9]">Transfer Sepolia(ETH)</h1>
        <p className="text-[#B9B9B9] mb-[2rem] w-[1000px] text-center">
          Sending your Sepolia(ETH) like a digital treasure across a vast,
          mysterious landscape. With a few simple steps and a secure
          transaction, you can safely transfer your ETH from one wallet to
          another. It's like sending a secret message through a hidden tunnel,
          ensuring your digital wealth arrives at its destination without a
          hitch.
        </p>
        <div className="flex items-center justify-center gap-8">
          <Image src={EthVector} alt="EthVector" className="w-[500px]" />
          <div className="flex gap-4 flex-col w-[600px]">
            <p className="text-[#B9B9B9] text-2xl">Now you can transfer ETH</p>
            <div className="grid grid-cols-2 items-start justify-center gap-8 w-full rounded-[10px] p-2 shadow-sm shadow-[#b9b9b9] border-[2px] border-[#b9b9b9]">
              <div className="[&>*]:text-[#b9b9b9] flex flex-col gap-2 item-center justify-center">
                <p>Account</p>
                <p className="break-all">
                  {address ? address : "Waiting for connect wallet..."}
                </p>
              </div>
              <div className="[&>*]:text-[#b9b9b9] flex flex-col gap-2 items-start justify-center">
                <p>Balance</p>
                <p>{balance ? balance : "Waiting for connect wallet..."}</p>
              </div>
            </div>
            <label className="shadow-sm shadow-[#b9b9b9] flex border-[2px] border-[#b9b9b9] gap-2 rounded-[10px] overflow-hidden">
              <div className="bg-[#b9b9b9] p-4">
                <FaWallet className="!text-black text-xl" />
              </div>
              <input
                className="bg-transparent text-[#b9b9b9] outline-none w-full"
                placeholder="Address"
                type="text"
                onChange={(e) => setToAddress(e.target.value)}
              />
            </label>
            <label className="shadow-sm shadow-[#b9b9b9] flex border-[2px] border-[#b9b9b9] gap-2 rounded-[10px] overflow-hidden">
              <div className="bg-[#b9b9b9] p-3">
                <SiEthereum className="!text-black text-3xl" />
              </div>
              <input
                className="bg-transparent text-[#b9b9b9] outline-none w-full"
                placeholder="ETH Amount"
                type="number"
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label className="shadow-sm shadow-[#b9b9b9] flex p-4 border-[2px] border-[#b9b9b9] gap-2 rounded-[10px] overflow-hidden">
              <textarea
                className="bg-transparent text-[#b9b9b9] outline-none w-full"
                placeholder="Message"
                type="text"
                onChange={(e) => setMessage(e.target.value)}
                rows={10}
              />
            </label>
            <button
              onClick={() => {
                transfer();
                setIsLoading(true);
              }}
              className="bg-[#b9b9b9] text-center text-black p-2 rounded-[12px]"
            >
              {isLoading === true ? (
                <div className="flex items-center justify-center gap-2">
                  <AiOutlineLoading3Quarters className="animate-spin" />
                  <p>Transfering...</p>
                </div>
              ) : (
                "Transfer"
              )}
            </button>
          </div>
        </div>
      </div>
      <div
        className="w-full flex flex-col gap-3 items-center justify-center mt-10"
        id="transaction"
      >
        <h2 className="text-4xl text-[#b9b9b9]">Transaction History</h2>
        <p className="text-[#b9b9b9] mb-[2rem] w-[1000px] text-center">
          Ever wondered where your Sepolia(ETH) has been? Or perhaps you're
          curious about the intricacies of a smart contract interaction? Our
          Ethereum transaction history explorer offers a crystal-clear view into
          the blockchain's bustling activity
        </p>
        {transactions?.length < 1 ? (
          <p className="text-[#b9b9b9]">Waiting for connect wallet...</p>
        ) : (
          <div className="grid grid-cols-4 justify-center gap-4">
            {transactions?.map((item, index) => (
              <div
                key={index}
                className="overflow-hidden pt-4 rounded-[15px] shadow-sm shadow-[#b9b9b9] [&>*]:text-[#b9b9b9] border-[2px] border-[#b9b9b9] flex flex-col justify-between"
              >
                <FaWallet className="text-7xl mx-auto mb-[1rem]" />
                <div className="px-4 pb-4">
                  <p>
                    From:{" "}
                    {item.from.substring(0, 8) +
                      "..." +
                      item.from.substr(item.from.length - 8)}
                  </p>
                  <p>
                    To:{" "}
                    {item.to.substring(0, 8) +
                      "..." +
                      item.to.substr(item.to.length - 8)}
                  </p>
                  <p>
                    Amount: {ethers.formatEther(item.amount.toString())} ETH
                  </p>
                </div>
                <button
                  onClick={() => {
                    setMessageResponse(item.message);
                    handleOpen();
                  }}
                  className="w-full bg-[#b9b9b9] !text-black"
                >
                  Message
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer></Footer>
    </section>
  );
}
