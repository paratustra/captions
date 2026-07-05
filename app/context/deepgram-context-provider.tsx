"use client";

import {
  createClient,
  LiveConnectionState,
  LiveTranscriptionEvents,
  type LiveSchema,
  type ListenLiveClient,
} from "@deepgram/sdk";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type DeepgramContextValue = {
  connection: ListenLiveClient | null;
  connectToDeepgram: (options: LiveSchema, endpoint?: string) => Promise<void>;
  disconnectFromDeepgram: () => void;
  connectionState: LiveConnectionState;
};

const DeepgramContext = createContext<DeepgramContextValue | undefined>(
  undefined,
);

const getToken = async (): Promise<string> => {
  const response = await fetch("/api/authenticate", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to obtain Deepgram token");
  }
  const { access_token: accessToken } = await response.json();
  return accessToken;
};

const DeepgramContextProvider = ({ children }: { children: ReactNode }) => {
  const [connection, setConnection] = useState<ListenLiveClient | null>(null);
  const [connectionState, setConnectionState] = useState<LiveConnectionState>(
    LiveConnectionState.CLOSED,
  );

  const connectToDeepgram = useCallback(
    async (options: LiveSchema, endpoint?: string) => {
      // Must pass `accessToken` (Bearer scheme) — a raw string is treated as an
      // API key (Token scheme) and the WebSocket handshake fails.
      const accessToken = await getToken();
      const deepgram = createClient({ accessToken });

      const conn = deepgram.listen.live(options, endpoint);

      conn.addListener(LiveTranscriptionEvents.Open, () => {
        setConnectionState(LiveConnectionState.OPEN);
      });

      conn.addListener(LiveTranscriptionEvents.Close, () => {
        setConnectionState(LiveConnectionState.CLOSED);
      });

      setConnection(conn);
    },
    [],
  );

  const disconnectFromDeepgram = useCallback(() => {
    setConnection((conn) => {
      conn?.requestClose();
      return null;
    });
  }, []);

  return (
    <DeepgramContext.Provider
      value={{
        connection,
        connectToDeepgram,
        disconnectFromDeepgram,
        connectionState,
      }}
    >
      {children}
    </DeepgramContext.Provider>
  );
};

function useDeepgram() {
  const context = useContext(DeepgramContext);
  if (context === undefined) {
    throw new Error(
      "useDeepgram must be used within a DeepgramContextProvider",
    );
  }
  return context;
}

export {
  DeepgramContextProvider,
  useDeepgram,
  LiveConnectionState,
  LiveTranscriptionEvents,
};
