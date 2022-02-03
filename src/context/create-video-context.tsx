import React from "react";

interface Video {
  source: string | null;
  sourceStartTime: number;
  sourceEndTime: number;
  intro?: string;
  outro?: string;
  output?: string;
}

type VideoContextType = {
  videoState: Video;
  setSource: (source: string) => void;
  setSourceTimes: (sourceStartTime: number, sourceEndTime: number) => void;
  setComposition: (intro: string, outro: string) => void;
  setOutput: (output: string | null) => void;
  resetVideo: () => void;
};

const initialState: Video = {
  source: null,
  sourceStartTime: 0,
  sourceEndTime: 0,
};

type Props = {
  children: React.ReactNode;
};

const VideoContext = React.createContext<VideoContextType | null>(null);

function VideoProvider({ children }: Props) {
  const [videoState, setVideoState] = React.useState<Video>(initialState);
  const setSource = (source: string) => {
    setVideoState({ ...videoState, source });
  };
  const setSourceTimes = (sourceStartTime: number, sourceEndTime: number) => {
    setVideoState({ ...videoState, sourceStartTime, sourceEndTime });
  };
  const setComposition = (intro: string, outro: string) => {
    setVideoState({ ...videoState, intro, outro });
  };
  const setOutput = (output: string | null) => {
    if (output) setVideoState({ ...videoState, output });
    else {
      delete videoState.output;
      setVideoState({ ...videoState });
    }
  };
  const resetVideo = () => setVideoState(initialState);
  const videoContextValue: VideoContextType = {
    videoState,
    setSource,
    setSourceTimes,
    setComposition,
    setOutput,
    resetVideo,
  };

  return (
    <VideoContext.Provider value={videoContextValue}>
      {children}
    </VideoContext.Provider>
  );
}

const useVideo = () => React.useContext(VideoContext) as VideoContextType;

export { VideoProvider, useVideo };
