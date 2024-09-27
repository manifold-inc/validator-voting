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
  onConnectionChange: (isConnected: boolean) => void;
}

export default function WalletModal({
  isOpen,
  onClose,
  onConnectionChange,
}: WalletModalProps) {
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
      if (allAccounts.length > 0) {
        setAccounts(allAccounts);
        setConnectionState("selecting");
        onConnectionChange(true); // Update connection status
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
    onConnectionChange(false);
    disconnectAccount();
  }, [onConnectionChange, disconnectAccount]);

  const handleAccountSelect = (account: InjectedAccountWithMeta) => {
    setSelectedAccount(account);
    setConnectionState("connected");
    setConnectedAccount(account.address);
    onConnectionChange(true);
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
      <DialogBackdrop className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
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
            <div>
              <div
                className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                  connectionState === "connected"
                    ? "bg-green-100"
                    : connectionState === "failed"
                      ? "bg-red-100"
                      : "bg-yellow-100"
                }`}
              >
                {getStatusIcon()}
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <DialogTitle
                  as="h3"
                  className="text-base font-semibold leading-6 text-gray-900"
                >
                  {connectionState === "connected"
                    ? "Connected"
                    : "Connect your Wallet"}
                </DialogTitle>
                <div className="mt-2">
                  {connectionState === "selecting" ? (
                    <div>
                      <p className="mb-2 text-sm text-gray-500">
                        Select an account:
                      </p>
                      {accounts.map((account) => (
                        <button
                          key={account.address}
                          onClick={() => handleAccountSelect(account)}
                          className="w-full rounded p-2 text-left hover:bg-gray-100"
                        >
                          {account.meta.name} ({account.address.slice(0, 6)}...
                          {account.address.slice(-4)})
                        </button>
                      ))}
                    </div>
                  ) : connectionState === "connected" ? (
                    <div>
                      <p className="text-sm text-gray-500">
                        Account: {selectedAccount?.meta.name} (
                        {selectedAccount?.address.slice(0, 6)}...
                        {selectedAccount?.address.slice(-4)})
                      </p>
                      <button
                        onClick={handleDisconnect}
                        className="mt-2 text-sm text-red-600 hover:text-red-500"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Click the button below to connect your wallet.
                    </p>
                  )}
                  {errorMessage && (
                    <p className="mt-2 text-sm text-red-500">{errorMessage}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              {connectionState === "connected" ? (
                <Link
                  href="/staking"
                  onClick={onClose}
                  className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Go to Staking
                </Link>
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
