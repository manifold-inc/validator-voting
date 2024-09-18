"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { WalletIcon } from "@heroicons/react/16/solid";
import Image from "next/image";
import Link from "next/link";

const navigation = [
  { name: "Validator", href: "/" },
  { name: "Delegators", href: "/delegators" },
  { name: "My Stake", href: "/staking" },
  { name: "My Weights", href: "/weights" },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [taoPrice, setTaoPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tao-price")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch price");
        }
        return response.json();
      })
      .then(
        (data: {
          currentPrices: Array<{ price: { price: string; expo: number } }>;
        }) => {
          if (data.currentPrices && data.currentPrices.length > 0) {
            const priceData = data.currentPrices[0]?.price;
            if (
              priceData?.price !== undefined &&
              priceData.expo !== undefined
            ) {
              const priceValue =
                Number(priceData.price) * Math.pow(10, priceData.expo);
              setTaoPrice(priceValue);
            } else {
              throw new Error("Invalid price data");
            }
          } else {
            throw new Error("Price data not found");
          }
          setIsLoading(false);
        },
      )
      .catch((err: Error) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <header className="bg-white">
      <nav
        aria-label="Global"
        className="flex items-center justify-between p-6 lg:px-8"
      >
        <div className="flex items-center gap-2 lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Validator Voting</span>
            <Image alt="" src="/BridgeTao.svg" width={32} height={32} />
          </Link>
          <Link
            href="https://www.coingecko.com/en/coins/bittensor"
            target="_blank"
            className="text-sm font-semibold leading-6 text-gray-900 hover:underline"
          >
            {taoPrice ? `$${taoPrice.toFixed(2)}` : "Loading..."}
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-semibold leading-6 text-gray-900 hover:underline"
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <button
            type="button"
            className="flex gap-2 text-sm font-semibold leading-6 text-gray-900 hover:underline"
          >
            Connect Wallet <WalletIcon className="h-6 w-6" />
          </button>
        </div>
      </nav>
      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="lg:hidden"
      >
        <div className="fixed inset-0 z-10" />
        <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">Your Company</span>
              <Image alt="" src="/BridgeTao.svg" width={32} height={32} />
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
              <div className="py-6">
                <a
                  href="#"
                  className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                >
                  Connect Wallet
                </a>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}
