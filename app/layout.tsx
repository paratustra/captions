import { Inter } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

import { DeepgramContextProvider } from "./context/deepgram-context-provider";
import { MicrophoneContextProvider } from "./context/microphone-context-provider";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Real-time captions",
  description:
    "Real-time speech-to-text captions with optional live translation to English.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={cn("bg-black text-white", inter.className)}>
        <MicrophoneContextProvider>
          <DeepgramContextProvider>{children}</DeepgramContextProvider>
        </MicrophoneContextProvider>
      </body>
    </html>
  );
}
