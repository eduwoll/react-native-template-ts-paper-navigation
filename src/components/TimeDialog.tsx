import React from "react";
import { StyleSheet, TextInput as NativeTextInput, View } from "react-native";
import {
  Button,
  Caption,
  Dialog,
  Portal,
  Subheading,
  TextInput,
  Title,
} from "react-native-paper";
import TimeDialogBody from "./TimeDialogBody";

type TimeId = "" | "start" | "end";

export interface TimeDialogParams {
  visible: boolean;
  id: TimeId;
  time: number;
}

interface TimeDialogProps {
  params: TimeDialogParams;
  onConfirm: (result: number, id: TimeId) => void;
  onDismiss: () => void;
}

const isNumeric = (s: string) => /^\d+$/.test(s);

const correctTimeString = (s: string) => {
  var result = s;
  if (s == "") result = "00";
  if (s.length == 1) result = "0" + s;
  return result;
};

const TimeDialog: React.FC<TimeDialogProps> = function ({
  params,
  onConfirm,
  onDismiss,
}) {
  const { visible } = params;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <TimeDialogBody
          params={params}
          onDismiss={onDismiss}
          onConfirm={onConfirm}
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

export default TimeDialog;
