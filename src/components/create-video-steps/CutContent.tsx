import Slider from "@react-native-community/slider";
import { StackScreenProps } from "@react-navigation/stack";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  Caption,
  Card,
  Divider,
  IconButton,
  Subheading,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import Video from "react-native-video";
import { useVideo } from "../../context/create-video-context";

interface VideoState {
  startTime: number;
  endTime: number;
  currentTime: number;
}

const CutContent: React.FC<StackScreenProps<{}>> = ({ navigation }) => {
  const { videoState, setSourceTimes } = useVideo();
  const [paused, setPaused] = React.useState(false);
  const playerRef: React.ClassAttributes<Video>["ref"] = React.useRef(null);
  const duration = React.useRef<number>(0);
  const [currentTime, setCurrentTime] = React.useState<number>(0);
  const currentTimeRef = React.useRef<number>(0);
  const startTime = React.useRef<number>(0);
  const endTime = React.useRef<number>(0);
  const { colors } = useTheme();

  React.useEffect(() => {
    navigation.addListener("blur", () => {
      console.log(videoState.source);
      setPaused(true);
    });
  }, []);

  return (
    <Card style={{ margin: 16, flex: 1 }}>
      {videoState.source ? (
        <Video
          ref={playerRef}
          source={{
            uri:
              typeof videoState.source == "string"
                ? videoState.source
                : videoState.source.previewUrl,
          }}
          resizeMode="contain"
          paused={paused}
          onEnd={() => setPaused(true)}
          // currentTime={currentTimeRef.current}
          style={{ flex: 1, borderTopLeftRadius: 4, borderTopRightRadius: 4 }}
          bufferConfig={{ bufferForPlaybackAfterRebufferMs: 0 }}
          onProgress={async (value) => {
            if (value.currentTime >= videoState.sourceEndTime) {
              setPaused(true);
              playerRef.current?.seek(endTime.current, 0);
            } else if (value.currentTime < videoState.sourceStartTime) {
              // playerRef.current?.seek(startTime.current, 0);
            }
            setCurrentTime(value.currentTime);
          }}
          onLoad={(value) => {
            duration.current = value.duration;
            setSourceTimes(0, value.duration);
          }}
        />
      ) : (
        <></>
      )}
      <Divider />
      <Card.Content>
        <View style={{ flexDirection: "row", justifyContent: "space-evenly" }}>
          <IconButton
            icon="rewind"
            onPress={() => null}
            size={40}
            color={colors.text}
          />
          <IconButton
            icon={paused ? "play" : "pause"}
            onPress={() => setPaused(!paused)}
            size={40}
            color={colors.text}
          />
          <IconButton
            icon="fast-forward"
            onPress={() => null}
            size={40}
            color={colors.text}
          />
        </View>
        <Caption style={{ textAlign: "center", fontSize: 16 }}>
          {new Date(currentTime * 1000).toISOString().substr(11, 8)}
        </Caption>
        <Slider
          style={styles.slider}
          value={currentTime}
          onValueChange={(value) => {
            currentTimeRef.current = value;
          }}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => {
            var currentTime = 5;
            if (currentTimeRef.current < videoState.sourceStartTime)
              currentTime = startTime.current;
            else if (currentTimeRef.current > videoState.sourceEndTime)
              currentTime = endTime.current;
            else currentTime = currentTimeRef.current;

            playerRef.current?.seek(currentTime);
            setCurrentTime(currentTime);
          }}
          minimumValue={0}
          maximumValue={duration.current}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor="#000000"
          thumbTintColor={colors.accent}
        />

        <View style={styles.sliderTitle}>
          <Subheading style={{ textAlign: "center" }}>Início:</Subheading>
          <Button mode="text" onPress={() => console.log("Pressed")}>
            {new Date(videoState.sourceStartTime * 1000)
              .toISOString()
              .substr(11, 8)}
          </Button>
        </View>
        <Slider
          style={styles.slider}
          value={videoState.sourceStartTime}
          onValueChange={(value) => {
            startTime.current = value;
          }}
          onTouchEnd={() => {
            if (startTime.current > currentTime)
              setSourceTimes(currentTime, videoState.sourceEndTime);
            else setSourceTimes(startTime.current, videoState.sourceEndTime);
          }}
          onTouchStart={() => setPaused(true)}
          minimumValue={0}
          maximumValue={duration.current}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor="#000000"
          thumbTintColor={colors.primary}
        />

        <View style={styles.sliderTitle}>
          <Subheading style={{ textAlign: "center" }}>Fim:</Subheading>
          <Button mode="text" onPress={() => console.log("Pressed")}>
            {new Date(videoState.sourceEndTime * 1000)
              .toISOString()
              .substr(11, 8)}
          </Button>
        </View>
        <Slider
          style={styles.slider}
          value={duration.current - videoState.sourceEndTime}
          onValueChange={(value) => {
            endTime.current = duration.current - value;
          }}
          inverted
          onTouchEnd={() => {
            if (endTime.current < currentTime)
              setSourceTimes(videoState.sourceStartTime, currentTime);
            else setSourceTimes(videoState.sourceStartTime, endTime.current);
          }}
          onTouchStart={() => setPaused(true)}
          minimumValue={0}
          maximumValue={duration.current}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor="#000000"
          thumbTintColor={colors.primary}
        />
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  slider: {},
  sliderTitle: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "baseline",
    marginTop: 16,
  },
});

export default CutContent;
