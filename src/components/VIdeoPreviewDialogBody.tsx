import React from "react";
import { StyleSheet, TextInput as NativeTextInput, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Caption,
  Dialog,
  Portal,
  Subheading,
  Text,
  TextInput,
  Title,
} from "react-native-paper";
import Video from "react-native-video";
import { VideoIntro, VideoOutro } from "../context/create-video-context";
import { getIntroFilePath, getOutroFilePath } from "../utils/filesHelper";
import { finais, intros } from "../utils/links";

interface Props {
  intro?: VideoIntro;
  outro?: VideoOutro;
  onDismiss: () => void;
}

const VideoPreviewDialogBody: React.FC<Props> = function ({
  intro,
  outro,
  onDismiss,
}) {
  const [loading, setLoading] = React.useState(true);
  const [filePath, setFilePath] = React.useState("");

  if (!intro && !outro) return null;

  const getFile = async () => {
    const filePath = await (intro
      ? getIntroFilePath(intro)
      : outro
      ? getOutroFilePath(outro)
      : "");

    setFilePath(filePath);
    setLoading(false);
  };

  React.useEffect(() => {
    getFile();
  }, []);

  return (
    <>
      {/* @ts-ignore */}
      <Dialog.Title>Visualizar Vídeo</Dialog.Title>
      <Dialog.Content>
        {loading ? (
          <>
            <ActivityIndicator size="large" style={{ marginTop: 8 }} />
            <Text
              onPressIn={undefined}
              onPressOut={undefined}
              android_hyphenationFrequency={undefined}
              style={{ textAlign: "center", marginTop: 8 }}
            >
              Baixando
            </Text>
          </>
        ) : (
          <View style={{  }}>
            <Video
              source={{ uri: filePath }}
              style={{
                aspectRatio: 16/9,
                width: "100%"
              }}
              resizeMode="contain"
            />
          </View>
        )}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Fechar</Button>
      </Dialog.Actions>
    </>
  );
};

const styles = StyleSheet.create({
  dialogTitle: {
    padding: 16,
    flexDirection: "row",
    alignItems: "baseline",
  },
  inputContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  timeSeparator: {
    marginHorizontal: 8,
    fontSize: 20,
  },
});

export default VideoPreviewDialogBody;
