import { type PropsWithChildren } from "react";

export const BlurWithoutWallet = ({
  connectedAccount,
  children,
  message,
}: {
  connectedAccount: string | null;
  message: string;
} & PropsWithChildren) => {
  return (
    <div>
      <div
        className={
          !connectedAccount
            ? "absolute left-1/2 top-1/2 z-10 -translate-x-1/2 rounded-lg bg-white p-5 shadow-lg"
            : "hidden"
        }
      >
        {message}
      </div>
      <div
        className={
          "" + (!connectedAccount ? "pointer-events-none blur-md" : "")
        }
      >
        {children}
      </div>
    </div>
  );
};
