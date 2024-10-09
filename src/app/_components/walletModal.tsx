import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  CheckIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState, useCallback } from "react";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import Link from "next/link";
import { type InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { useWalletStore } from "~/providers/wallet-store-provider";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const [connectionState, setConnectionState] = useState<
    "idle" | "connecting" | "connected" | "failed" | "selecting"
  >("idle");
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<InjectedAccountWithMeta | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setConnectedAccount = useWalletStore(
    (state) => state.setConnectedAccount,
  );
  const disconnectAccount = useWalletStore((state) => state.disconnectAccount);

  const handleConnect = async () => {
    setConnectionState("connecting");
    setErrorMessage(null);
    try {
      // Enable web3
      const extensions = await web3Enable(
        process.env.POLKADOT_EXTENSION_ID ?? "Tao Validator Voting",
      );
      if (extensions.length === 0) {
        throw new Error(
          "No Polkadot extension found. Please install the Polkadot.js extension and try again.",
        );
      }

      // Get all accounts
      const allAccounts = await web3Accounts();
      if (allAccounts.length === 1) {
        handleAccountSelect(allAccounts.at(0)!);
        setConnectionState("connected");
        return;
      }
      if (allAccounts.length > 0) {
        setAccounts(allAccounts);
        setConnectionState("selecting");
      } else {
        throw new Error(
          "No accounts found. Please create an account in the Polkadot.js extension.",
        );
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setConnectionState("failed");
      setErrorMessage(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    }
  };

  const handleDisconnect = useCallback(() => {
    setSelectedAccount(null);
    setAccounts([]);
    setConnectionState("idle");
    disconnectAccount();
  }, [disconnectAccount]);

  const handleAccountSelect = (account: InjectedAccountWithMeta) => {
    setSelectedAccount(account);
    setConnectionState("connected");
    setConnectedAccount(account.address);
  };

  const getStatusIcon = () => {
    switch (connectionState) {
      case "connected":
        return <CheckIcon className="h-6 w-6 text-green-600" />;
      case "failed":
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />;
      default:
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
          >
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <div className="sm:flex sm:items-start">
              <div
                className={
                  "mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 " +
                  (connectionState === "connected"
                    ? "bg-green-100"
                    : connectionState === "failed"
                      ? "bg-red-100"
                      : "bg-yellow-100")
                }
              >
                {getStatusIcon()}
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <DialogTitle
                  as="h3"
                  className="text-base font-semibold leading-6 text-gray-900"
                >
                  {connectionState === "connected"
                    ? "Connected"
                    : "Connect your Wallet"}
                </DialogTitle>
                <div className="mt-2">
                  <div className="text-sm text-gray-500">
                    {connectionState === "selecting" ? (
                      <div>
                        <p className="mb-2 text-sm text-gray-500">
                          Select an account to vote for subnets. You can come
                          back use another wallet later on.
                        </p>
                        <div className="pr-10">
                          {accounts.map((account) => (
                            <button
                              key={account.address}
                              onClick={() => handleAccountSelect(account)}
                              className="mt-1 w-full rounded bg-gray-100 p-2 text-left text-black hover:bg-gray-200"
                            >
                              {account.meta.name} ({account.address.slice(0, 6)}
                              ...
                              {account.address.slice(-4)})
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : connectionState === "connected" ? (
                      <div>
                        <p className="text-sm text-gray-500">
                          Connected to account {selectedAccount?.meta.name} (
                          {selectedAccount?.address.slice(0, 6)}...
                          {selectedAccount?.address.slice(-4)}). You{"'"}re all
                          ready to start voting!
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Click the button below to connect your wallet.
                      </p>
                    )}
                    {errorMessage && (
                      <p className="mt-2 text-sm text-red-500">
                        {errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-auto mt-5 w-fit sm:mt-6">
              {connectionState === "connected" ? (
                <div className="flex w-fit gap-4">
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:ml-3 sm:mt-0 sm:w-auto"
                  >
                    Disconnect
                  </button>
                  <Link
                    href="/staking"
                    onClick={onClose}
                    className="inline-flex justify-center rounded-md bg-indigo-600 px-10 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Go to Staking
                  </Link>
                </div>
              ) : connectionState === "selecting" ? (
                <p className="text-sm text-gray-500">
                  Please select an account above.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={connectionState === "connecting"}
                  className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-300"
                >
                  {connectionState === "connecting"
                    ? "Connecting..."
                    : "Connect Wallet"}
                </button>
              )}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
