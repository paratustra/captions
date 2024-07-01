"use client";

import { useEffect, useRef, useState } from "react";
import {
  MicrophoneEvents,
  MicrophoneState,
  useMicrophone,
} from "@/app/context/MicrophoneContextProvider";
import {
  LiveConnectionState,
  LiveTranscriptionEvents,
  useDeepgram,
} from "@/app/context/DeepgramContextProvider";
import { Spinner } from "@/components/ui/spinner";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { motion } from "framer-motion";

const Transcription = () => {
  const [caption, setCaption] = useState("");
  const [lastValidCaption, setLastValidCaption] = useState("");
  const [translatedCaption, setTranslatedCaption] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(false);

  const { connection, connectToDeepgram, connectionState } = useDeepgram();
  const { setupMicrophone, microphone, startMicrophone, microphoneState } =
    useMicrophone();
  const captionTimeout = useRef();
  const keepAliveInterval = useRef();

  useEffect(() => {
    setupMicrophone();
  }, []);

  useEffect(() => {
    if (microphoneState === MicrophoneState.Ready) {
      connectToDeepgram({
        model: "nova-2",
        language: "es-ES",
        interim_results: true,
        smart_format: false,
        punctuation: false,
        filler_words: false,
        utterance_end_ms: 1000,
      });
    }
  }, [microphoneState, connectToDeepgram]);

  const translateText = async (text) => {
    setIsTranslating(true);
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Translation request failed");
      }

      const data = await response.json();
      setTranslatedCaption(data.translatedText);
    } catch (error) {
      console.error("Translation error:", error);
      setTranslatedCaption("Error occurred during translation");
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    if (!microphone || !connection) return;

    const onData = (e) => {
      connection?.send(e.data);
    };

    const onTranscript = (data) => {
      const { is_final: isFinal, speech_final: speechFinal } = data;
      let thisCaption = data.channel.alternatives[0].transcript;

      if (thisCaption !== "") {
        setCaption(thisCaption);
        setLastValidCaption(thisCaption);
        if (autoTranslate) {
          translateText(thisCaption);
        }
      }

      if (isFinal && speechFinal) {
        clearTimeout(captionTimeout.current);
        captionTimeout.current = setTimeout(() => {
          setCaption(undefined);
          setTranslatedCaption("");
          clearTimeout(captionTimeout.current);
        }, 3000);
      }
    };

    if (connectionState === LiveConnectionState.OPEN) {
      connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
      microphone.addEventListener(MicrophoneEvents.DataAvailable, onData);

      startMicrophone();
    }

    return () => {
      connection.removeListener(
        LiveTranscriptionEvents.Transcript,
        onTranscript
      );
      microphone.removeEventListener(MicrophoneEvents.DataAvailable, onData);
      clearTimeout(captionTimeout.current);
    };
  }, [connectionState, autoTranslate, connection, microphone, startMicrophone]);

  useEffect(() => {
    if (!connection) return;

    const sendKeepAlive = () => {
      if (connection.getReadyState() === WebSocket.OPEN) {
        try {
          connection.keepAlive();
        } catch (error) {
          console.error("Error sending keep-alive:", error);
        }
      }
    };

    if (
      microphoneState !== MicrophoneState.Open &&
      connectionState === LiveConnectionState.OPEN
    ) {
      sendKeepAlive();

      keepAliveInterval.current = setInterval(sendKeepAlive, 10000);
    } else {
      clearInterval(keepAliveInterval.current);
    }

    return () => {
      clearInterval(keepAliveInterval.current);
    };
  }, [microphoneState, connectionState, connection]);

  return (
    <div className="flex flex-col text-white mb-4 text-center items-center">
      <div className="mb-4 h-8">
        <ToggleSwitch
          onCheckedChange={(checked) => setAutoTranslate(checked)}
        />
      </div>
      <div className="mt-4 h-fit py-0.5 px-4 flex items-center justify-center font-bold text-[64px] bg-white/80 text-black">
        {caption || lastValidCaption ? (
          <motion.div
            key={
              autoTranslate ? translatedCaption : caption || lastValidCaption
            }
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              bounce: 0.25,
              duration: 0.2,
            }}
          >
            {autoTranslate
              ? isTranslating
                ? translatedCaption || <Spinner />
                : translatedCaption
              : caption || lastValidCaption}
          </motion.div>
        ) : (
          <Spinner />
        )}
      </div>
    </div>
  );
};

export default Transcription;
