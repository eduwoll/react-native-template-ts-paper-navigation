import * as React from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";
import Share from "react-native-share";
import Video from "react-native-video";
import { useVideo } from "../../context/create-video-context";

const ShareVideo: React.FC = () => {
  const { videoState } = useVideo();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 16,
      }}
    >
      {videoState.output && (
        <>
          <Video
            source={{ uri: videoState.output }}
            style={{
              flex: 1,
              margin: 8,
              backgroundColor: "#000",
            }}
            resizeMode="contain"
            controls
          />
          <Button
            mode="contained"
            onPress={() =>
              Share.open({
                type: "video/mp4",
                url: videoState.output,
              })
            }
            icon="share"
          >
            Compartilhar Vídeo
          </Button>
        </>
      )}
    </View>
  );
};

export default ShareVideo;
