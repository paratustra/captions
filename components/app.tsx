import Transcription from "@/app/transcription";

const App = () => {
  return (
    <div className="relative flex-grow">
      <div className="fixed left-0 top-0 flex h-full w-full select-none flex-col items-center justify-center">
        <Transcription />
      </div>
    </div>
  );
};

export default App;
