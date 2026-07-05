"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export const MicrophoneEvents = {
  DataAvailable: "dataavailable",
  Error: "error",
  Pause: "pause",
  Resume: "resume",
  Start: "start",
  Stop: "stop",
} as const;

export enum MicrophoneState {
  NotSetup = -1,
  SettingUp = 0,
  Ready = 1,
  Opening = 2,
  Open = 3,
  Error = 4,
  Pausing = 5,
  Paused = 6,
}

type MicrophoneContextValue = {
  microphone: MediaRecorder | null;
  startMicrophone: () => void;
  stopMicrophone: () => void;
  setupMicrophone: () => Promise<void>;
  microphoneState: MicrophoneState;
};

const MicrophoneContext = createContext<MicrophoneContextValue | undefined>(
  undefined,
);

const MicrophoneContextProvider = ({ children }: { children: ReactNode }) => {
  const [microphoneState, setMicrophoneState] = useState<MicrophoneState>(
    MicrophoneState.NotSetup,
  );
  const [microphone, setMicrophone] = useState<MediaRecorder | null>(null);

  const setupMicrophone = useCallback(async () => {
    setMicrophoneState(MicrophoneState.SettingUp);

    try {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
        },
      });

      const recorder = new MediaRecorder(userMedia);

      setMicrophoneState(MicrophoneState.Ready);
      setMicrophone(recorder);
    } catch (err) {
      setMicrophoneState(MicrophoneState.Error);
      console.error(err);
      throw err;
    }
  }, []);

  const stopMicrophone = useCallback(() => {
    setMicrophoneState(MicrophoneState.Pausing);

    if (microphone?.state === "recording") {
      microphone.pause();
      setMicrophoneState(MicrophoneState.Paused);
    }
  }, [microphone]);

  const startMicrophone = useCallback(() => {
    setMicrophoneState(MicrophoneState.Opening);

    if (!microphone) {
      console.error("Microphone is not initialized");
      setMicrophoneState(MicrophoneState.Error);
      return;
    }

    if (microphone.state === "inactive") {
      microphone.start(250);
    } else if (microphone.state === "paused") {
      microphone.resume();
    }
    setMicrophoneState(MicrophoneState.Open);
  }, [microphone]);

  return (
    <MicrophoneContext.Provider
      value={{
        microphone,
        startMicrophone,
        stopMicrophone,
        setupMicrophone,
        microphoneState,
      }}
    >
      {children}
    </MicrophoneContext.Provider>
  );
};

function useMicrophone() {
  const context = useContext(MicrophoneContext);

  if (context === undefined) {
    throw new Error(
      "useMicrophone must be used within a MicrophoneContextProvider",
    );
  }

  return context;
}

export { MicrophoneContextProvider, useMicrophone };
