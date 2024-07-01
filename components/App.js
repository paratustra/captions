"use client";

import Transcription from "@/app/transcription";

const App = () => {
  return (
    <div className="flex-grow relative">
      <div className="fixed top-0 left-0 w-full h-full flex flex-col items-center justify-center select-none">
        <Transcription />
      </div>
    </div>
  );
};

export default App;
