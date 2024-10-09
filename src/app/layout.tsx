import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import Navbar from "~/app/_components/navbar";
import Footer from "~/app/_components/footer";
import { WalletStoreProvider } from "~/providers/wallet-store-provider";
import { Toaster } from "sonner";
import { TRPCReactProvider } from "~/trpc/react";
import { env } from "~/env.mjs";

export const metadata: Metadata = {
  title: env.NEXT_PUBLIC_VALIDATOR_NAME,
  description: "Created by Manifold Labs",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <TRPCReactProvider>
          <WalletStoreProvider>
            <Toaster richColors />
            <Navbar />
            {children}
            <Footer />
          </WalletStoreProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
