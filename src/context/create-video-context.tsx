import React from "react";
import { intros, finais } from "../utils/links";

export interface VideoInfo {
  link: string;
  extension: string;
}

export type VideoIntro = keyof typeof intros | "";

export type VideoOutro = keyof typeof finais | "";

export interface VideoInfoResponse {
  video: VideoInfo;
  audio: VideoInfo;
  preview: VideoInfo;
}

interface Video {
  source: null | string | { video: string; audio: string; previewUrl: string };
  sourceStartTime: number;
  sourceEndTime: number;
  intro: VideoIntro;
  outro: VideoOutro;
  output?: string;
}

type VideoContextType = {
  videoState: Video;
  setSource: (source: Video["source"]) => void;
  setSourceTimes: (sourceStartTime: number, sourceEndTime: number) => void;
  setIntro: (intro: VideoIntro) => void;
  setOutro: (outro: VideoOutro) => void;
  setOutput: (output: string | null) => void;
  resetVideo: () => void;
};

const initialState: Video = {
  source: null,
  sourceStartTime: 0,
  sourceEndTime: 0,
  intro: "padrao",
  outro: "padrao",
};

type Props = {
  children: React.ReactNode;
};

const VideoContext = React.createContext<VideoContextType | null>(null);

function VideoProvider({ children }: Props) {
  const [videoState, setVideoState] = React.useState<Video>(initialState);
  const setSource = (source: typeof videoState.source) => {
    setVideoState({ ...videoState, source });
  };
  const setSourceTimes = (sourceStartTime: number, sourceEndTime: number) => {
    setVideoState({ ...videoState, sourceStartTime, sourceEndTime });
  };
  const setIntro = (intro: VideoIntro) => {
    setVideoState((current) => ({ ...current, intro }));
  };
  const setOutro = (outro: VideoOutro) => {
    setVideoState((current) => ({ ...current, outro }));
  };
  const setOutput = (output: string | null) => {
    if (output) setVideoState((current) => ({ ...current, output }));
    else {
      setVideoState((current) => {
        delete current.output;
        return current;
      });
    }
  };
  const resetVideo = () => setVideoState(initialState);
  const videoContextValue: VideoContextType = {
    videoState,
    setSource,
    setSourceTimes,
    setIntro,
    setOutro,
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
