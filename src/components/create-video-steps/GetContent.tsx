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
} from "react-native-paper";
import { useVideo } from "../../context/create-video-context";

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
  const downloadRef = React.useRef<DownloadTask | null>(null);
  const { setSource } = useVideo();

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

  const downloadVideo = async () => {
    try {
      const videoId = encodeURI(youtubeUrl);
      setDownloadProgress(0);
      var screenUpdatedAt = new Date();
      var lastUpdateBytes = 0;
      const url =
        "https://videos.eucreio.org/api/downloadVideo?videoId=" +
        videoId;

      console.log(url);

      await new Promise((res)=>{

      })
      downloadRef.current = RNBackgroundDownloader.download({
        id: "file123",
        url,
        destination: `${RNBackgroundDownloader.directories.documents}/file.zip`,
      })
        .begin((expectedBytes) => {
          console.log(`Going to download ${expectedBytes} bytes!`);
        })
        .progress((percent) => {
          console.log(`Downloaded: ${percent * 100}%`);
        })
        .done(() => {
          console.log("Download is done!");
        })
        .error((error) => {
          console.log("Download canceled due to error: ", error);
        });
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
      console.log(e);
    }
    setStatus(null);

    // const ytVData = new Uint8Array(ytVFetch.data);
    // const ytVBlob = new Blob([ytVData.buffer]);
    // setUrlTemplate(URL.createObjectURL(ytVBlob));
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
        onPress={() => setModalYoutube(true)}
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
        <Dialog visible={modalYoutube} onDismiss={() => setModalYoutube(false)}>
          {/* @ts-ignore*/}
          <Dialog.Title>Baixar do YouTube</Dialog.Title>
          <Dialog.Content>
            <TextInput
              autoFocus
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
            <Button onPress={() => setModalYoutube(false)}>Cancelar</Button>
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
