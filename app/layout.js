import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

import { DeepgramContextProvider } from "./context/DeepgramContextProvider";
import { MicrophoneContextProvider } from "./context/MicrophoneContextProvider";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ className, children }) {
  return (
    <html lang="en">
      <body className={cn("bg-black text-white", inter.className, className)}>
        <MicrophoneContextProvider>
          <DeepgramContextProvider>{children}</DeepgramContextProvider>
        </MicrophoneContextProvider>
      </body>
    </html>
  );
}
