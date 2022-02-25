import React from "react";
import { StyleSheet } from "react-native";
import {
  Dialog,
  Portal
} from "react-native-paper";
import { VideoIntro, VideoOutro } from "../context/create-video-context";
import VideoPreviewDialogBody from "./VIdeoPreviewDialogBody";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  intro?: VideoIntro;
  outro?: VideoOutro;
}

const VideoPreviewDialog: React.FC<Props> = function ({
  visible,
  intro,
  outro,
  onDismiss,
}) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <VideoPreviewDialogBody
          intro={intro}
          outro={outro}
          onDismiss={onDismiss}
        />
      </Dialog>
    </Portal>
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

export default VideoPreviewDialog;
