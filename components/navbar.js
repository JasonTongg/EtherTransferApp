import React from "react";
import { LiaEthereum } from "react-icons/lia";
import Link from "next/link";

export default function navbar({ connectWallet, address }) {
  return (
    <nav className="w-full [&>*]:text-[#b9b9b9] gap-8 flex items-center justify-center sm:justify-between">
      <Link href="#" className="sm:block hidden">
        <LiaEthereum className="text-5xl !text-[#b9b9b9]" />
      </Link>
      <div className="flex items-center justify-center gap-9">
        <Link href="#transfer">Transfer</Link>
        <Link href="#transaction">Transaction</Link>
        {address ? (
          <p>
            {address.substring(0, 5) +
              "..." +
              address.substr(address.length - 5)}
          </p>
        ) : (
          <button
            onClick={connectWallet}
            className="bg-[#b9b9b9] text-black px-4 py-2 rounded-[10px] hover:-translate-y-2 active:-translate-y-1 hover:scale-105 active:scale-100 transition-all"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}
