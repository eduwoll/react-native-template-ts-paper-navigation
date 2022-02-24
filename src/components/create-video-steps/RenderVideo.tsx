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

interface Stream {
  path: string;
  duration: number;
}

interface Streams {
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

  React.useEffect(() => {
    return () => {
      if (executionRef.current) RNFFmpeg.cancelExecution(executionRef.current);
    };
  }, []);

  const handleRenderButtonPress = async () => {
    if (!videoState.source) return;
    console.log(videoState);
    try {
      if (executionRef.current) RNFFmpeg.cancelExecution(executionRef.current);
      setOutput(null);
      setLoading(true);
      const streams: Streams = {
        intro: {
          path: "file://" + RNFS.ExternalDirectoryPath + "/intro.mp4",
          duration: 0,
        },
        outro: {
          path: "file://" + RNFS.ExternalDirectoryPath + "/outro.mp4",
          duration: 0,
        },
        output: {
          path: "file://" + RNFS.ExternalDirectoryPath + "/output.mp4",
          duration: 0,
        },
      };

      if (typeof videoState.source == "string") {
        streams.source = {
          path: "file://" + videoState.source,
          duration: 0,
        };
      } else {
        streams.sourceVideo = {
          path: "file://" + videoState.source.video,
          duration: 0,
        };
        streams.sourceAudio = {
          path: "file://" + videoState.source.audio,
          duration: 0,
        };
      }

      const fsPromises: Promise<any>[] = [];

      setStatus("Baixando intro e final...");
      fsPromises.push(
        RNFS.downloadFile({
          fromUrl:
            "https://firebasestorage.googleapis.com/v0/b/eu-creio-videos.appspot.com/o/videos%2Fintros%2Fpregacao.mp4?alt=media&token=8c85b8bf-0491-4c3a-98a1-9f07b6176c2b",
          toFile: streams.intro.path,
        }).promise
      );

      fsPromises.push(
        RNFS.downloadFile({
          fromUrl:
            "https://firebasestorage.googleapis.com/v0/b/eu-creio-videos.appspot.com/o/videos%2Ffinais%2Fpadrao.mp4?alt=media&token=9620f949-ead6-462d-a2a9-cfde2812568e",
          toFile: streams.outro.path,
        }).promise
      );

      try {
        await RNFS.unlink(streams.output.path);
      } catch (e) {}
      await Promise.all(fsPromises);
      setStatus("Calculando...");

      function getStreamDuration(key: keyof Streams) {
        return new Promise<number>((res) => {
          console.log;
          RNFFmpegConfig.enableLogCallback((log) => res(+log.message));
          RNFFmpegConfig.setLogLevel(LogLevel.AV_LOG_QUIET);
          RNFFprobe.execute(
            `-v error -select_streams v:0 -show_entries stream=duration -of default=noprint_wrappers=1:nokey=1 ${
              streams[key]?.path || ""
            }`
          );
        });
      }

      streams.intro.duration = await getStreamDuration("intro");
      streams.outro.duration = await getStreamDuration("outro");

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
        videoState.sourceStartTime -
        (sourceDuration - videoState.sourceEndTime) -
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

      var executionArray: string[] = [];

      if (streams.source)
        executionArray = [
          "-i",
          streams.intro.path,
          "-i",
          streams.source.path,
          "-i",
          streams.outro.path,
          "-filter_complex",
          `
        [0:v]
          scale=1280:720:force_original_aspect_ratio=decrease,
          pad=1280:720:-1:-1:color=black,
          setdar=16/9,
          settb=AVTB,
          fps=30/1,
          split=2[intro1][intro2];
        [1:v]
          scale=1280:720:force_original_aspect_ratio=decrease,
          pad=1280:720:-1:-1:color=black,
          setdar=16/9,
          settb=AVTB,
          fps=30/1,
          split=3[source1][source2][source3];
        [2:v]
          scale=1280:720:force_original_aspect_ratio=decrease,
          pad=1280:720:-1:-1:color=black,
          setdar=16/9,
          settb=AVTB,
          fps=30/1,
          split=2[outro1][outro2];
        [intro1]
          trim=
            start=0:
            end=${streams.intro.duration - 1},
          setpts=PTS-STARTPTS[intro];  
        [intro2]
          trim=
            start=${streams.intro.duration - 1},
          setpts=PTS-STARTPTS[introfadeout]; 
        [source1]
          trim=
            start=${videoState.sourceStartTime}:
            end=${videoState.sourceStartTime + 1},
            setpts=PTS-STARTPTS[sourcefadein];
        [source2]
          trim=
            start=${videoState.sourceStartTime + 1}:
            end=${videoState.sourceEndTime - 1},
          setpts=PTS-STARTPTS[source]; 
        [sourcefadein]
          format=pix_fmts=yuva420p,
          fade=
            t=in:
            st=0:
            d=1:
            alpha=1[fadein];
        [introfadeout]
          format=pix_fmts=yuva420p,
          fade=
            t=out:
            st=0:
            d=1:
            alpha=1[fadeout];
        [fadein]fifo[fadeinfifo];
        [fadeout]fifo[fadeoutfifo];
        [fadeoutfifo][fadeinfifo]overlay[crossfade];

        [source3]
          trim=
            start=${videoState.sourceEndTime - 1}:
            end=${videoState.sourceEndTime},
          setpts=PTS-STARTPTS[sourcefadeout]; 
        [outro2]
          trim=
            start=0:
            end=1,
          setpts=PTS-STARTPTS[outrofadein];
        [outro1]
          trim=
            start=1,
          setpts=PTS-STARTPTS[outro];  
        [outrofadein]
          format=pix_fmts=yuva420p,
          fade=
            t=in:
            st=0:
            d=1:
            alpha=1[fadein2];
        [sourcefadeout]
          format=pix_fmts=yuva420p,
          fade=
            t=out:
            st=0:
            d=1:
            alpha=1[fadeout2];
        [fadein2]fifo[fadeinfifo2];
        [fadeout2]fifo[fadeoutfifo2];
        [fadeoutfifo2][fadeinfifo2]overlay[crossfade2];
        [intro][crossfade][source][crossfade2][outro]concat=n=5[v];

        [1:a]
          atrim=
            start=${videoState.sourceStartTime}:
            end=${videoState.sourceEndTime}[sourcetrimmed];
        [0:a][sourcetrimmed]acrossfade=d=1[introsource];
        [introsource][2:a]acrossfade=d=1[a]
        `.replace(/[\n\ ]/gm, ""),
          "-map",
          "[v]",
          "-map",
          "[a]",
          streams.output.path,
        ];
      else if (streams.sourceVideo && streams.sourceAudio)
        executionArray = [
          "-i",
          streams.intro.path,
          "-i",
          streams.sourceVideo.path,
          "-i",
          streams.outro.path,
          "-i",
          streams.sourceAudio.path,
          "-filter_complex",
          `
          [0:v]
          scale=1280:720:force_original_aspect_ratio=decrease,
          pad=1280:720:-1:-1:color=black,
          setdar=16/9,
          settb=AVTB,
          fps=30/1,
          split=2[intro1][intro2];
        [1:v]
          scale=1280:720:force_original_aspect_ratio=decrease,
          pad=1280:720:-1:-1:color=black,
          setdar=16/9,
          settb=AVTB,
          fps=30/1,
          split=3[sourceVideo1][sourceVideo2][sourceVideo3];
        [2:v]
          scale=1280:720:force_original_aspect_ratio=decrease,
          pad=1280:720:-1:-1:color=black,
          setdar=16/9,
          settb=AVTB,
          fps=30/1,
          split=2[outro1][outro2];
        [intro1]
          trim=
            start=0:
            end=${streams.intro.duration - 1},
          setpts=PTS-STARTPTS[intro];  
        [intro2]
          trim=
            start=${streams.intro.duration - 1},
          setpts=PTS-STARTPTS[introfadeout]; 
        [sourceVideo1]
          trim=
            start=${videoState.sourceStartTime}:
            end=${videoState.sourceStartTime + 1},
            setpts=PTS-STARTPTS[sourcefadein];
        [sourceVideo2]
          trim=
            start=${videoState.sourceStartTime + 1}:
            end=${videoState.sourceEndTime - 1},
          setpts=PTS-STARTPTS[source]; 
        [sourcefadein]
          format=pix_fmts=yuva420p,
          fade=
            t=in:
            st=0:
            d=1:
            alpha=1[fadein];
        [introfadeout]
          format=pix_fmts=yuva420p,
          fade=
            t=out:
            st=0:
            d=1:
            alpha=1[fadeout];
        [fadein]fifo[fadeinfifo];
        [fadeout]fifo[fadeoutfifo];
        [fadeoutfifo][fadeinfifo]overlay[crossfade];
  
        [sourceVideo3]
          trim=
            start=${videoState.sourceEndTime - 1}:
            end=${videoState.sourceEndTime},
          setpts=PTS-STARTPTS[sourcefadeout]; 
        [outro2]
          trim=
            start=0:
            end=1,
          setpts=PTS-STARTPTS[outrofadein];
        [outro1]
          trim=
            start=1,
          setpts=PTS-STARTPTS[outro];  
        [outrofadein]
          format=pix_fmts=yuva420p,
          fade=
            t=in:
            st=0:
            d=1:
            alpha=1[fadein2];
        [sourcefadeout]
          format=pix_fmts=yuva420p,
          fade=
            t=out:
            st=0:
            d=1:
            alpha=1[fadeout2];
        [fadein2]fifo[fadeinfifo2];
        [fadeout2]fifo[fadeoutfifo2];
        [fadeoutfifo2][fadeinfifo2]overlay[crossfade2];
        [intro][crossfade][source][crossfade2][outro]concat=n=5[v];
  
        [3:a]
          atrim=
            start=${videoState.sourceStartTime}:
            end=${videoState.sourceEndTime}[sourcetrimmed];
        [0:a][sourcetrimmed]acrossfade=d=1[introsource];
        [introsource][2:a]acrossfade=d=1[a]
        `.replace(/[\n\ ]/gm, ""),
          "-map",
          "[v]",
          "-map",
          "[a]",
          streams.output.path,
        ];

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
