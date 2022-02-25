import notifee from "@notifee/react-native";
import * as React from "react";
import { View } from "react-native";
import {
  LogLevel,
  RNFFmpeg,
  RNFFmpegConfig,
  RNFFprobe,
} from "react-native-ffmpeg";
import * as RNFS from "react-native-fs";
import { Button, Caption, ProgressBar, useTheme } from "react-native-paper";
import { useVideo } from "../../context/create-video-context";
import { getRenderCommands } from "../../utils/ffmpegHelper";
import { getIntroFilePath, getOutroFilePath } from "../../utils/filesHelper";
import { finais, intros } from "../../utils/links";

export interface Stream {
  path: string;
  duration: number;
}

export interface Streams {
  intro: Stream;
  outro: Stream;
  source?: Stream;
  sourceVideo?: Stream;
  sourceAudio?: Stream;
  output: Stream;
}

const RenderVideo: React.FC = () => {
  const { videoState, setOutput } = useVideo();
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState("Aguardando");
  const [progress, setProgress] = React.useState(0);
  const { colors } = useTheme();
  const executionRef = React.useRef<number>();

  const { source, sourceStartTime, sourceEndTime, intro, outro } = videoState;

  React.useEffect(() => {
    console.log(videoState);
    return () => {
      if (executionRef.current) RNFFmpeg.cancelExecution(executionRef.current);
    };
  }, []);

  const handleRenderButtonPress = async () => {
    if (!source) return;
    console.log(videoState);
    try {
      if (executionRef.current) RNFFmpeg.cancelExecution(executionRef.current);
      setOutput(null);
      setLoading(true);

      setStatus("Carregando intro e final...");
      const introPath = await getIntroFilePath(intro);
      const outroPath = await getOutroFilePath(outro);

      const streams: Streams = {
        intro: {
          path: introPath,
          duration: 0,
        },
        outro: {
          path: outroPath,
          duration: 0,
        },
        output: {
          path: "file://" + RNFS.ExternalDirectoryPath + "/output.mp4",
          duration: 0,
        },
      };

      if (typeof source == "string") {
        streams.source = {
          path: "file://" + source,
          duration: 0,
        };
      } else {
        streams.sourceVideo = {
          path: "file://" + source.video,
          duration: 0,
        };
        streams.sourceAudio = {
          path: "file://" + source.audio,
          duration: 0,
        };
      }

      try {
        await RNFS.unlink(streams.output.path);
      } catch (e) {}
      setStatus("Calculando...");

      function getStreamDuration(key: keyof Streams) {
        return new Promise<number>((res) => {
          console.log(key, streams[key]);
          RNFFmpegConfig.enableLogCallback((log) => res(+log.message));
          RNFFmpegConfig.setLogLevel(LogLevel.AV_LOG_QUIET);
          RNFFprobe.execute(
            `-v error -select_streams v:0 -show_entries stream=duration -of default=noprint_wrappers=1:nokey=1 ${
              streams[key]?.path || ""
            }`
          );
        });
      }

      if (introPath) streams.intro.duration = await getStreamDuration("intro");
      if (outroPath) streams.outro.duration = await getStreamDuration("outro");

      var sourceDuration = 0;
      if (streams.source) {
        streams.source.duration = await getStreamDuration("source");
        sourceDuration = streams.source.duration;
      } else if (streams.sourceAudio && streams.sourceVideo) {
        sourceDuration = await getStreamDuration("sourceVideo");
        streams.sourceVideo.duration = sourceDuration;
        streams.sourceAudio.duration = sourceDuration;
      }

      streams.output.duration =
        streams.intro.duration +
        streams.outro.duration +
        sourceDuration -
        sourceStartTime -
        (sourceDuration - sourceEndTime) -
        2;

      console.log({ streams, videoState });
      setStatus("Renderizando");
      RNFFmpegConfig.setLogLevel(LogLevel.AV_LOG_DEBUG);

      var oldProgress = 0;
      const totalFrames = streams.output.duration * 30;
      const startTime = new Date().getTime();
      RNFFmpegConfig.enableLogCallback(({ message }) => {
        const extracted = message.match(/(frame= *)([0-9]+)/);
        if (extracted) {
          const currentFrame = +extracted[2];
          const newProgress = currentFrame / totalFrames;

          console.log(currentFrame, newProgress);
          if (newProgress >= 1) return;

          if (newProgress > oldProgress) {
            oldProgress = newProgress;
            setProgress(newProgress);
            const currentTime = new Date().getTime();
            const elapsedTime = new Date(currentTime - startTime).getTime();
            const remainingTime = new Date(
              (elapsedTime * totalFrames) / currentFrame - elapsedTime
            )
              .toISOString()
              .substr(11, 8);

            setStatus(`Renderizando (Tempo Restante: ${remainingTime})`);

            notifee.displayNotification({
              id: "download",
              title: "Renderizando...",
              body: `Progresso: ${(newProgress * 100).toFixed(1)}%`,
              android: {
                pressAction: { id: "teste2", mainComponent: "EuCreioMidia" },
                ongoing: true,
                channelId: "default",
                sound: "null",
                color: colors.primary,
                autoCancel: false,
                actions: [
                  {
                    title: "Cancelar",
                    pressAction: { id: "teste" },
                  },
                ],
                progress: {
                  max: 100,
                  current: newProgress * 100,
                  // indeterminate: true,
                },
                smallIcon: "ic_launcher", // optional, defaults to 'ic_launcher'.
              },
            });
          }
        } else {
          console.log(message);
        }
      });

      const executionArray: string[] = getRenderCommands(
        streams,
        sourceStartTime,
        sourceEndTime,
        intro === "hinos_especiais"
      );

      // if (false)
      executionRef.current = await RNFFmpeg.executeAsyncWithArguments(
        executionArray,
        (res) => {
          console.log(res);
          if (res.returnCode === 0) {
            setStatus("Concluído!");
            setOutput(streams.output.path);
          } else {
            setStatus("Erro");
          }
          executionRef.current = undefined;
          setLoading(false);
          notifee.cancelNotification("download");
          setProgress(0);
        }
      );

      // await RNFFmpeg.executeAsync(
      //   `-i file:/${destPath} -c:v mpeg4 file2.mp4`,
      //   console.log
      // );
    } catch (err) {
      setLoading(false);
      setStatus("erro");
      console.error(err);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 16,
      }}
    >
      {!loading ? (
        <Button
          mode="contained"
          onPress={handleRenderButtonPress}
          icon="video-vintage"
          disabled={loading}
        >
          Renderizar
        </Button>
      ) : (
        <>
          <Caption style={{ marginTop: 16 }}>{status}</Caption>
          <ProgressBar progress={progress} indeterminate={progress == 0} />
        </>
      )}
    </View>
  );
};

export default RenderVideo;
