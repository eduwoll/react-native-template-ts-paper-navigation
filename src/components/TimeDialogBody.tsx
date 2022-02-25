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

const TimeDialogBody: React.FC<TimeDialogProps> = function ({
  params,
  onConfirm,
  onDismiss,
}) {
  const { visible, id, time } = params;

  const [timeState, setTimeState] = React.useState({
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  const minutesInputRef = React.useRef<NativeTextInput>(null);
  const secondsInputRef = React.useRef<NativeTextInput>(null);

  React.useEffect(() => {
    if (!visible) return;

    const [hours, minutes, seconds] = new Date(time * 1000)
      .toISOString()
      .substr(11, 8)
      .split(":");

    setTimeState({ hours, minutes, seconds });
  }, [params]);

  return (
    <>
      <View style={styles.dialogTitle}>
        <Title>Digitar tempo </Title>
        <Caption style={{ paddingBottom: 4 }}>(hh:mm:ss)</Caption>
      </View>
      <Dialog.Content>
        <View style={styles.inputContent}>
          <TextInput
            onPressIn={undefined}
            onPressOut={undefined}
            value={timeState.hours}
            onChangeText={(hours) => {
              if (isNumeric(hours) || hours === "")
                setTimeState({ ...timeState, hours });

              if (hours.length === 2) minutesInputRef.current?.focus();
            }}
            onBlur={() => {
              const { hours } = timeState;
              const correctedTime = correctTimeString(hours);
              if (correctedTime !== hours)
                setTimeState({ ...timeState, hours: correctedTime });
            }}
            keyboardType="numeric"
            maxLength={2}
            selectTextOnFocus
          />

          <Subheading style={styles.timeSeparator}>:</Subheading>

          <TextInput
            ref={minutesInputRef}
            onPressIn={undefined}
            onPressOut={undefined}
            value={timeState.minutes}
            onChangeText={(minutes) => {
              if (isNumeric(minutes) || minutes === "") {
                if (+minutes >= 60) minutes = "59";
                setTimeState({ ...timeState, minutes });
              }
              if (minutes.length === 2) secondsInputRef.current?.focus();
            }}
            onBlur={() => {
              const { minutes } = timeState;
              const correctedTime = correctTimeString(minutes);
              if (correctedTime !== minutes)
                setTimeState({ ...timeState, minutes: correctedTime });
            }}
            keyboardType="numeric"
            maxLength={2}
            selectTextOnFocus
          />

          <Subheading style={styles.timeSeparator}>:</Subheading>
          <TextInput
            ref={secondsInputRef}
            onPressIn={undefined}
            onPressOut={undefined}
            value={timeState.seconds}
            onChangeText={(seconds) => {
              if (isNumeric(seconds) || seconds === "") {
                if (+seconds >= 60) seconds = "59";
                setTimeState({ ...timeState, seconds });
              }
            }}
            onBlur={() => {
              const { seconds } = timeState;
              const correctedTime = correctTimeString(seconds);
              if (correctedTime !== seconds)
                setTimeState({ ...timeState, seconds: correctedTime });
            }}
            keyboardType="numeric"
            maxLength={2}
            selectTextOnFocus
          />
        </View>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cancelar</Button>
        <Button
          onPress={() => {
            const { hours, minutes, seconds } = timeState;
            const result = +hours * 3600 + +minutes * 60 + +seconds;
            onConfirm(result, id);
          }}
        >
          Ok
        </Button>
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

export default TimeDialogBody;
