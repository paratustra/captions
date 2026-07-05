"use client";

import {
  createClient,
  LiveConnectionState,
  LiveTranscriptionEvents,
} from "@deepgram/sdk";

import { createContext, useCallback, useContext, useState } from "react";

const DeepgramContext = createContext(undefined);

const getToken = async () => {
  const response = await fetch("/api/authenticate", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to obtain Deepgram token");
  }
  const { access_token: accessToken } = await response.json();
  return accessToken;
};

const DeepgramContextProvider = ({ children }) => {
  const [connection, setConnection] = useState(null);
  const [connectionState, setConnectionState] = useState(
    LiveConnectionState.CLOSED
  );

  /**
   * Connects to the Deepgram speech recognition service and sets up a live transcription session.
   *
   * @param {Object} options - The configuration options for the live transcription session.
   * @param {string} [endpoint] - The optional endpoint URL for the Deepgram service.
   * @returns {Promise<void>} A Promise that resolves when the connection is established.
   */
  const connectToDeepgram = useCallback(async (options, endpoint) => {
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
  }, []);

  const disconnectFromDeepgram = async () => {
    if (connection) {
      connection.finish();
      setConnection(null);
    }
  };

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
      "useDeepgram must be used within a DeepgramContextProvider"
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
