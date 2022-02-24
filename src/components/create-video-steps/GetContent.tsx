import axios, { AxiosResponse } from "axios";
import RNBackgroundDownloader, {
  DownloadTask,
} from "react-native-background-downloader";
import * as React from "react";
import { View } from "react-native";
import DocumentPicker from "react-native-document-picker";
import * as RNFS from "react-native-fs";
import {
  ActivityIndicator,
  Button,
  Caption,
  Dialog,
  Portal,
  ProgressBar,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import {
  useVideo,
  VideoInfoResponse,
} from "../../context/create-video-context";
import Clipboard from "@react-native-community/clipboard";
import notifee, { EventType } from "@notifee/react-native";

async function storeVideo(extension: string, path: string) {
  const destPath = RNFS.ExternalDirectoryPath + "/source." + extension;
  await RNFS.copyFile(path, destPath);
  return destPath;
}

const GetContent: React.FC = () => {
  const [modalYoutube, setModalYoutube] = React.useState(false);
  const [youtubeUrl, setYoutubeUrl] = React.useState("");
  const [status, setStatus] = React.useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const videoDownloadRef = React.useRef<{
    video: DownloadTask | null;
    audio: DownloadTask | null;
  }>({ video: null, audio: null });
  const nUpdaterRef = React.useRef<NodeJS.Timer | null>(null);
  const { setSource } = useVideo();
  const { colors } = useTheme();

  async function displayNotification() {
    console.log(nUpdaterRef.current);
    // Display a notification
  }

  async function createNotificationChannel() {
    const channelId = await notifee.createChannel({
      id: "default",
      name: "Default Channel",
      vibration: false,
      sound: undefined,
      importance: 2,
      badge: false,
    });

    const unsubscribe = notifee.onBackgroundEvent(async ({ type, detail }) => {
      const { notification, pressAction } = detail;
      console.log(detail);

      // Check if the user pressed the "Mark as read" action
      if (type === EventType.ACTION_PRESS && pressAction?.id === "teste") {
        // Update external API
        // await fetch(
        //   `https://my-api.com/chat/${notification.data.chatId}/read`,
        //   {
        //     method: "POST",
        //   }
        // );
        // Remove the notification
        if (notification?.id) await notifee.cancelNotification(notification.id);
        if (nUpdaterRef.current) clearInterval(nUpdaterRef.current);
      }
    });
  }

  React.useEffect(() => {
    createNotificationChannel();
    return () => {
      notifee.cancelAllNotifications();
      videoDownloadRef.current.video?.stop;
      videoDownloadRef.current.audio?.stop;
      if (nUpdaterRef.current) clearInterval(nUpdaterRef.current);
    };
  }, []);

  const handleFileInputPress = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.video],
      });
      setLoading(true);
      setSource("");

      const video = res[0];
      console.log(res);

      const extension = video.type?.split("/")[1] || "mp4";

      setSource(await storeVideo(extension, video.uri));
      console.log("res : " + JSON.stringify(res));
    } catch (err) {
      // Handling any exception (If any)
      if (DocumentPicker.isCancel(err)) {
        // If user canceled the document selection
        console.log("Canceled");
      } else {
        // For Unknown Error
        console.warn("Unknown Error: " + JSON.stringify(err));
        throw err;
      }
    }
    setLoading(false);
  };

  const updateProgress = (
    progress: number,
    totalBytes: number,
    bytesWritten: number
  ) => {
    setDownloadProgress(progress);
    setStatus(
      `Baixando vídeo: ${(progress * 100).toFixed(1)}%
${(bytesWritten / 1024 / 1024).toFixed(2)} de ${(
        totalBytes /
        1024 /
        1024
      ).toFixed(2)} MB`
    );
    notifee.displayNotification({
      id: "download",
      title: "Baixando...",
      body: `Progresso: ${(progress * 100).toFixed(1)}%`,
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
          current: progress * 100,
          // indeterminate: true,
        },
        smallIcon: "ic_launcher", // optional, defaults to 'ic_launcher'.
      },
    });
  };

  const downloadVideo = async () => {
    try {
      setSource("");
      setDownloadProgress(0);
      setStatus("Buscando dados...");
      const videoId = encodeURI(youtubeUrl);
      setDownloadProgress(0);
      var screenUpdatedAt = new Date();
      var lastUpdateBytes = 0;
      const url =
        "https://videos.eucreio.org/api/getVideoInfo?videoId=" +
        encodeURI(videoId);

      console.log(url);
      const res = await fetch(url);
      const data: VideoInfoResponse = await res.json();
      console.log(data);

      const sourceVideoPath =
        RNFS.ExternalDirectoryPath + "/sourceVideo." + data.video.extension;
      const sourceAudioPath =
        RNFS.ExternalDirectoryPath + "/sourceAudio." + data.audio.extension;

      const completeDownload = () => {
        notifee.cancelNotification("download");
        console.log("Download is done!", videoDownloadRef.current.video?.state);
        setSource({
          video: sourceVideoPath,
          audio: sourceAudioPath,
          previewUrl: data.preview.link,
        });
        setStatus(null);
        setModalYoutube(false);
      };

      videoDownloadRef.current.video = RNBackgroundDownloader.download({
        id: "sourceVideo",
        url: data.video.link,
        destination: sourceVideoPath,
      })
        .begin((expectedBytes) => {
          console.log(`Video: ${(expectedBytes / 1024 / 1024).toFixed(2)} Mb`);
        })
        .progress((progress) => {
          if (!videoDownloadRef.current.video) return;

          const bytesWritten = videoDownloadRef.current.audio
            ? videoDownloadRef.current.video.bytesWritten +
              videoDownloadRef.current.audio.bytesWritten
            : videoDownloadRef.current.video.bytesWritten;

          const totalBytes = videoDownloadRef.current.audio
            ? videoDownloadRef.current.video.totalBytes +
              videoDownloadRef.current.audio.totalBytes
            : videoDownloadRef.current.video.totalBytes;

          progress = bytesWritten / totalBytes;

          updateProgress(progress, totalBytes, bytesWritten);
        })
        .done(() => {
          if (videoDownloadRef.current.audio?.state == "DONE") {
            completeDownload();
          }
        })
        .error((error) => {
          console.log("Download canceled due to error: ", error);
        });

      videoDownloadRef.current.audio = RNBackgroundDownloader.download({
        id: "sourceAudio",
        url: data.audio.link,
        destination: sourceAudioPath,
      })
        .begin((expectedBytes) => {
          console.log(`Audio: ${(expectedBytes / 1024 / 1024).toFixed(2)} Mb`);
        })
        .progress((progress) => {
          if (!videoDownloadRef.current.audio) return;

          const bytesWritten = videoDownloadRef.current.video
            ? videoDownloadRef.current.video.bytesWritten +
              videoDownloadRef.current.audio.bytesWritten
            : videoDownloadRef.current.audio.bytesWritten;

          const totalBytes = videoDownloadRef.current.video
            ? videoDownloadRef.current.video.totalBytes +
              videoDownloadRef.current.audio.totalBytes
            : videoDownloadRef.current.audio.totalBytes;

          progress = bytesWritten / totalBytes;

          updateProgress(progress, totalBytes, bytesWritten);
        })
        .done(() => {
          if (videoDownloadRef.current.video?.state == "DONE") {
            completeDownload();
          }
        })
        .error((error) => {
          console.log("Download canceled due to error: ", error);
        });

      return;
      const ytVFetch: AxiosResponse<Blob> = await axios.request({
        method: "get",
        url,
        responseType: "blob",
        onDownloadProgress: (p) => {
          if (p.total == 0) {
            setDownloadProgress(1);
          } else {
            const progress = p.loaded / p.total;
            setDownloadProgress(progress);
            const lastScreenUpdate =
              (new Date().getTime() - screenUpdatedAt.getTime()) / 1000;

            if (lastScreenUpdate >= 1) {
              const speed = (
                (p.loaded - lastUpdateBytes) /
                lastScreenUpdate /
                1024 /
                1024
              ).toFixed(2);

              const totalSize = (p.total / 1024 / 1024).toFixed(2);
              const downloadedSize = (p.loaded / 1024 / 1024).toFixed(2);
              setStatus(`
Velocidade: ${speed}MB/s
Baixado: ${downloadedSize}MB de ${totalSize}MB`);
              screenUpdatedAt = new Date();
              lastUpdateBytes = p.loaded;
            }
          }
        },
      });
      const ytVFormat = ytVFetch.headers["content-type"]
        .split("/")[1]
        .split(";")[0];

      const blob = ytVFetch.data;
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      const base64data = await new Promise<string>((res) => {
        reader.onloadend = function () {
          const base64data = reader.result.toString().split(",")[1];
          res(base64data);
        };
      });
      setSource(await storeVideo(ytVFormat, base64data));
      setModalYoutube(false);
    } catch (e) {
      console.warn(e);
    }
    setStatus(null);

    // const ytVData = new Uint8Array(ytVFetch.data);
    // const ytVBlob = new Blob([ytVData.buffer]);
    // setUrlTemplate(URL.createObjectURL(ytVBlob));
  };

  const dismissModal = () => {
    notifee.cancelNotification("download");
    videoDownloadRef.current.video?.stop();
    videoDownloadRef.current.audio?.stop();
    setModalYoutube(false);
    setYoutubeUrl("");
    setLoading(false);
    setStatus(null);
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 16,
      }}
    >
      <Button
        mode="contained"
        onPress={handleFileInputPress}
        icon="upload"
        disabled={loading}
      >
        Selecionar da Galeria
      </Button>
      <Caption style={{ textAlign: "center", marginVertical: 8, fontSize: 16 }}>
        ou
      </Caption>
      <Button
        mode="contained"
        onPress={async () => {
          setYoutubeUrl(await Clipboard.getString());
          setModalYoutube(true);
        }}
        icon="youtube"
        disabled={loading}
      >
        Baixar do YouTube
      </Button>

      <ActivityIndicator
        size="large"
        style={{ marginTop: 16, [!loading ? "height" : ""]: 0 }}
        hidesWhenStopped
        animating={loading}
      />

      <Portal>
        <Dialog visible={modalYoutube} onDismiss={dismissModal}>
          {/* @ts-ignore*/}
          <Dialog.Title>Baixar do YouTube</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="URL"
              style={{ backgroundColor: "none" }}
              value={youtubeUrl}
              onChangeText={setYoutubeUrl}
              onPressIn={undefined}
              onPressOut={undefined}
              disabled={!!status}
            />
          </Dialog.Content>
          {status && (
            <Dialog.Content>
              <ProgressBar progress={downloadProgress} />
              {/* @ts-ignore */}
              <Text>{status}</Text>
            </Dialog.Content>
          )}
          <Dialog.Actions>
            <Button onPress={dismissModal}>Cancelar</Button>
            <Button onPress={downloadVideo} disabled={!!status}>
              Ok
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

export default GetContent;
