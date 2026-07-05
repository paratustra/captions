"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MicrophoneEvents,
  MicrophoneState,
  useMicrophone,
} from "@/app/context/microphone-context-provider";
import {
  LiveConnectionState,
  LiveTranscriptionEvents,
  useDeepgram,
} from "@/app/context/deepgram-context-provider";
import { Spinner } from "@/components/ui/spinner";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { motion, useReducedMotion } from "framer-motion";
import type { LiveTranscriptionEvent } from "@deepgram/sdk";

// How long a caption lingers on screen after the speaker stops.
const CAPTION_CLEAR_MS = 3000;
// Cadence for keep-alive pings while the mic is idle but the socket is open.
const KEEP_ALIVE_MS = 10000;

const Transcription = () => {
  const [caption, setCaption] = useState("");
  const [lastValidCaption, setLastValidCaption] = useState("");
  const [translatedCaption, setTranslatedCaption] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(false);

  const { connection, connectToDeepgram, connectionState } = useDeepgram();
  const { setupMicrophone, microphone, startMicrophone, microphoneState } =
    useMicrophone();

  const captionTimeout = useRef<ReturnType<typeof setTimeout>>();
  const keepAliveInterval = useRef<ReturnType<typeof setInterval>>();

  // Race guard: interim transcripts arrive faster than translations resolve.
  // We tag each request and only keep the newest, and abort superseded fetches.
  const translationSeq = useRef(0);
  const translationAbort = useRef<AbortController | null>(null);

  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setupMicrophone();
  }, [setupMicrophone]);

  useEffect(() => {
    if (microphoneState === MicrophoneState.Ready) {
      connectToDeepgram({
        model: "nova-2",
        language: "es",
        interim_results: true,
        smart_format: false,
        punctuate: false,
        filler_words: false,
        utterance_end_ms: 1000,
      });
    }
  }, [microphoneState, connectToDeepgram]);

  const translateText = useCallback(async (text: string) => {
    const seq = ++translationSeq.current;
    translationAbort.current?.abort();
    const controller = new AbortController();
    translationAbort.current = controller;

    setIsTranslating(true);
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Translation request failed");
      }

      const data = await response.json();
      // Ignore results that a newer request has already superseded.
      if (seq === translationSeq.current) {
        setTranslatedCaption(data.translatedText);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error("Translation error:", error);
      if (seq === translationSeq.current) {
        setTranslatedCaption("Error occurred during translation");
      }
    } finally {
      if (seq === translationSeq.current) {
        setIsTranslating(false);
      }
    }
  }, []);

  // Translate the current caption immediately when translation is switched on.
  useEffect(() => {
    if (autoTranslate && lastValidCaption) {
      translateText(lastValidCaption);
    }
    // Only react to the toggle flipping on, not to every caption change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTranslate]);

  useEffect(() => {
    if (!microphone || !connection) return;

    const onData = (event: BlobEvent) => {
      // Empty chunks can drop a paused socket; ignore them.
      if (event.data.size > 0) {
        connection.send(event.data);
      }
    };

    const onTranscript = (data: LiveTranscriptionEvent) => {
      const { is_final: isFinal, speech_final: speechFinal } = data;
      const thisCaption = data.channel.alternatives[0]?.transcript ?? "";

      if (thisCaption !== "") {
        setCaption(thisCaption);
        setLastValidCaption(thisCaption);
        // Only translate finalized segments — interim results would fire a
        // request on every keystroke-like update and thrash the API.
        if (autoTranslate && isFinal) {
          translateText(thisCaption);
        }
      }

      if (isFinal && speechFinal) {
        clearTimeout(captionTimeout.current);
        captionTimeout.current = setTimeout(() => {
          setCaption("");
          setLastValidCaption("");
          setTranslatedCaption("");
        }, CAPTION_CLEAR_MS);
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
        onTranscript,
      );
      microphone.removeEventListener(MicrophoneEvents.DataAvailable, onData);
      clearTimeout(captionTimeout.current);
    };
  }, [
    connectionState,
    autoTranslate,
    connection,
    microphone,
    startMicrophone,
    translateText,
  ]);

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
      keepAliveInterval.current = setInterval(sendKeepAlive, KEEP_ALIVE_MS);
    } else {
      clearInterval(keepAliveInterval.current);
    }

    return () => {
      clearInterval(keepAliveInterval.current);
    };
  }, [microphoneState, connectionState, connection]);

  const displayCaption = autoTranslate
    ? translatedCaption
    : caption || lastValidCaption;
  const hasCaption = Boolean(caption || lastValidCaption);
  const showSpinner =
    !hasCaption || (autoTranslate && isTranslating && !translatedCaption);

  return (
    <div className="mb-4 flex flex-col items-center text-center text-white">
      <div className="mb-4 h-8">
        <ToggleSwitch
          checked={autoTranslate}
          onCheckedChange={setAutoTranslate}
        />
      </div>
      <div
        aria-live="polite"
        aria-atomic="true"
        className="mt-4 flex h-fit items-center justify-center bg-white/80 px-4 py-0.5 text-[64px] font-bold text-black"
      >
        {showSpinner ? (
          <Spinner />
        ) : (
          <motion.div
            key={displayCaption}
            initial={prefersReducedMotion ? false : { scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.2 }}
          >
            {displayCaption}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Transcription;
