import { VideoIntro, VideoOutro } from "../context/create-video-context";
import * as RNFS from "react-native-fs";
import { finais, intros } from "./links";

const introsFolder = `file://${RNFS.ExternalDirectoryPath}/intros`;
const outrosFolder = `file://${RNFS.ExternalDirectoryPath}/finais`;

export const getIntroFilePath = async (intro: VideoIntro) => {
  if (!intro) return "";
  if (!(await RNFS.exists(introsFolder))) {
    await RNFS.mkdir(introsFolder);
  }
  const introPath = `${introsFolder}/${intro}.mp4`;

  if (!(await RNFS.exists(introPath))) {
    await RNFS.downloadFile({
      fromUrl: intros[intro],
      toFile: introPath,
    }).promise;
  }

  return introPath;
};

export const getOutroFilePath = async (outro: VideoOutro) => {
  if (!outro) return "";
  if (!(await RNFS.exists(outrosFolder))) {
    await RNFS.mkdir(outrosFolder);
  }
  const outroPath = `${outrosFolder}/${outro}.mp4`;

  if (!(await RNFS.exists(outroPath))) {
    await RNFS.downloadFile({
      fromUrl: finais[outro],
      toFile: outroPath,
    }).promise;
  }

  return outroPath;
};
